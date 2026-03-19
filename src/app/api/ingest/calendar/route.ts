import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCalendarEvents } from "@/lib/integrations/calendar";
import {
  refreshAndVerifyToken,
  ScopeError,
} from "@/lib/integrations/google-auth";

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

    // Refresh token AND verify it has calendar.readonly scope
    let accessToken: string;
    try {
      accessToken = await refreshAndVerifyToken(integration.refresh_token, [
        "https://www.googleapis.com/auth/calendar.readonly",
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
              "Calendar permission not granted. Please sign out and sign back in to grant Calendar access.",
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
        platform: "calendar",
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    const events = await fetchCalendarEvents(accessToken, 100);

    let contactsCreated = 0;

    for (const event of events) {
      const attendees = event.attendees || [];

      for (const attendee of attendees) {
        if (attendee.self || !attendee.email) continue;

        const { data: contact } = await supabase
          .from("contacts")
          .upsert(
            {
              user_id: user.id,
              email: attendee.email.toLowerCase(),
              full_name:
                attendee.displayName || attendee.email.split("@")[0],
              source: "calendar",
            },
            { onConflict: "user_id,email" }
          )
          .select("id")
          .single();

        if (!contact) continue;

        await supabase.from("interactions").insert({
          contact_id: contact.id,
          user_id: user.id,
          platform: "calendar",
          type: "meeting",
          subject: event.summary?.slice(0, 200),
          snippet: event.description?.slice(0, 200),
          metadata: {
            location: event.location,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
          },
          occurred_at:
            event.start?.dateTime ||
            event.start?.date ||
            new Date().toISOString(),
        });

        await supabase
          .from("contacts")
          .update({
            last_interaction_at:
              event.start?.dateTime || event.start?.date,
            interaction_count: contact.id
              ? (
                  await supabase
                    .from("interactions")
                    .select("*", { count: "exact", head: true })
                    .eq("contact_id", contact.id)
                ).count || 0
              : 0,
          })
          .eq("id", contact.id);

        contactsCreated++;
      }
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        total_items: events.length,
        processed_items: events.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      events_processed: events.length,
      contacts_created: contactsCreated,
    });
  } catch (err: any) {
    console.error("Calendar ingestion error:", err);

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
