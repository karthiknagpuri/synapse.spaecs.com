import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  refreshAndVerifyToken,
  ScopeError,
} from "@/lib/integrations/google-auth";
import { fetchGoogleContacts } from "@/lib/integrations/google-contacts";

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

    // Refresh token and verify contacts.readonly scope
    let accessToken: string;
    try {
      accessToken = await refreshAndVerifyToken(integration.refresh_token, [
        "https://www.googleapis.com/auth/contacts.readonly",
      ]);
    } catch (err) {
      if (err instanceof ScopeError) {
        await supabase
          .from("integrations")
          .update({ status: "needs_reauth" })
          .eq("user_id", user.id)
          .eq("platform", "google");

        return NextResponse.json(
          {
            error: "reauth_required",
            message:
              "Google Contacts permission not granted. Please re-authenticate to grant access.",
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

    // Create ingestion job
    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "google_contacts",
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Fetch contacts from Google People API
    const googleContacts = await fetchGoogleContacts(accessToken);

    let contactsCreated = 0;
    let contactsSkipped = 0;
    let photosUpdated = 0;

    for (const gc of googleContacts) {
      // Need at least a name to create a contact
      if (!gc.name) {
        contactsSkipped++;
        continue;
      }

      const upsertData: Record<string, unknown> = {
        user_id: user.id,
        full_name: gc.name,
        source: "gmail", // Using "gmail" source since it's from Google ecosystem
      };

      if (gc.email) upsertData.email = gc.email;
      if (gc.phone) upsertData.phone = gc.phone;
      if (gc.company) upsertData.company = gc.company;
      if (gc.title) upsertData.title = gc.title;
      if (gc.photoUrl) upsertData.avatar_url = gc.photoUrl;

      if (gc.email) {
        // Upsert by email - update existing contacts with richer data
        const { data: contact, error } = await supabase
          .from("contacts")
          .upsert(upsertData, { onConflict: "user_id,email" })
          .select("id, avatar_url")
          .single();

        if (error) {
          console.error("Contact upsert error:", error.message);
          contactsSkipped++;
          continue;
        }

        // Update photo if contact didn't have one
        if (gc.photoUrl && !contact.avatar_url) {
          await supabase
            .from("contacts")
            .update({ avatar_url: gc.photoUrl })
            .eq("id", contact.id);
          photosUpdated++;
        } else if (gc.photoUrl && contact.avatar_url) {
          photosUpdated++;
        }

        contactsCreated++;
      } else {
        // No email - try insert, skip on conflict
        const { error } = await supabase
          .from("contacts")
          .insert(upsertData);

        if (error) {
          contactsSkipped++;
          continue;
        }
        contactsCreated++;
      }
    }

    // Update ingestion job
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        total_items: googleContacts.length,
        processed_items: contactsCreated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    // Update last synced timestamp
    await supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("platform", "google");

    return NextResponse.json({
      success: true,
      contacts_fetched: googleContacts.length,
      contacts_imported: contactsCreated,
      contacts_skipped: contactsSkipped,
      photos_updated: photosUpdated,
    });
  } catch (err: any) {
    console.error("Google Contacts ingestion error:", err);

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
