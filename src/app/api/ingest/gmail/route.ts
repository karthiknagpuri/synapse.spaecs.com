import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGmailThreads,
  fetchThreadDetail,
  parseEmailAddress,
  extractHeader,
} from "@/lib/integrations/gmail";
import {
  refreshAndVerifyToken,
  ScopeError,
} from "@/lib/integrations/google-auth";
import { fetchGoogleProfilePhotos } from "@/lib/integrations/people";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .eq("platform", "google")
      .eq("status", "active")
      .single();

    if (!integration?.refresh_token) {
      return NextResponse.json(
        { error: "Google not connected. Please sign in with Google first." },
        { status: 400 }
      );
    }

    // Refresh token AND verify it has gmail.readonly scope
    let accessToken: string;
    try {
      accessToken = await refreshAndVerifyToken(integration.refresh_token, [
        "https://www.googleapis.com/auth/gmail.readonly",
      ]);
    } catch (err) {
      if (err instanceof ScopeError) {
        // Mark integration as needing re-auth
        await supabase
          .from("integrations")
          .update({ status: "needs_reauth" })
          .eq("user_id", user.id)
          .eq("platform", "google");

        return NextResponse.json(
          {
            error: "reauth_required",
            message:
              "Gmail permission not granted. Please sign out and sign back in to grant Gmail access.",
            missing_scopes: err.missingScopes,
          },
          { status: 403 }
        );
      }
      throw err;
    }

    // Update stored token
    await supabase
      .from("integrations")
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", "google");

    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "gmail",
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const threads = await fetchGmailThreads(accessToken, 200);

    let processed = 0;
    const contactsMap = new Map<string, any>();

    for (const thread of threads) {
      try {
        const detail = await fetchThreadDetail(accessToken, thread.id);

        for (const message of detail.messages || []) {
          const headers = message.payload?.headers || [];
          const from = parseEmailAddress(extractHeader(headers, "From"));
          const toRaw = extractHeader(headers, "To");
          const subject = extractHeader(headers, "Subject");
          const date = extractHeader(headers, "Date");

          if (from && from.email !== user.email) {
            if (!contactsMap.has(from.email)) {
              contactsMap.set(from.email, {
                email: from.email,
                name: from.name,
                interactions: [],
              });
            }
            contactsMap.get(from.email)!.interactions.push({
              type: "email_received",
              subject,
              snippet: message.snippet?.slice(0, 200) || "",
              date,
            });
          }

          const toAddresses = toRaw
            .split(",")
            .map((t: string) => parseEmailAddress(t.trim()))
            .filter(Boolean);
          for (const to of toAddresses) {
            if (to && to.email !== user.email) {
              if (!contactsMap.has(to.email)) {
                contactsMap.set(to.email, {
                  email: to.email,
                  name: to.name,
                  interactions: [],
                });
              }
              contactsMap.get(to.email)!.interactions.push({
                type: "email_sent",
                subject,
                snippet: message.snippet?.slice(0, 200) || "",
                date,
              });
            }
          }
        }

        processed++;
      } catch (err) {
        console.error(`Error processing thread ${thread.id}:`, err);
      }
    }

    let contactsCreated = 0;
    for (const [email, data] of contactsMap) {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .upsert(
          {
            user_id: user.id,
            email: email,
            full_name: data.name || email.split("@")[0],
            source: "gmail",
            interaction_count: data.interactions.length,
            last_interaction_at: data.interactions[0]?.date
              ? new Date(data.interactions[0].date).toISOString()
              : null,
          },
          { onConflict: "user_id,email" }
        )
        .select("id")
        .single();

      if (contactError || !contact) continue;

      const interactions = data.interactions.slice(0, 20).map((i: any) => ({
        contact_id: contact.id,
        user_id: user.id,
        platform: "gmail" as const,
        type: i.type,
        subject: i.subject?.slice(0, 200),
        snippet: i.snippet,
        occurred_at: i.date
          ? new Date(i.date).toISOString()
          : new Date().toISOString(),
      }));

      await supabase.from("interactions").insert(interactions);
      contactsCreated++;
    }

    // Fetch and update profile photos from Google People API
    let photosUpdated = 0;
    try {
      const photoMap = await fetchGoogleProfilePhotos(accessToken);
      for (const [email, data] of contactsMap) {
        const photoUrl = photoMap.get(email.toLowerCase());
        if (photoUrl) {
          await supabase
            .from("contacts")
            .update({ avatar_url: photoUrl })
            .eq("user_id", user.id)
            .eq("email", email);
          photosUpdated++;
        }
      }
    } catch (err) {
      console.warn("Photo fetch failed (non-critical):", err);
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        total_items: threads.length,
        processed_items: processed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      threads_processed: processed,
      contacts_created: contactsCreated,
      photos_updated: photosUpdated,
    });
  } catch (err: any) {
    console.error("Gmail ingestion error:", err);

    // Handle scope errors from fetchGmailThreads
    if (err.message?.startsWith("SCOPE_ERROR:")) {
      return NextResponse.json(
        {
          error: "reauth_required",
          message: err.message.replace("SCOPE_ERROR: ", ""),
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}
