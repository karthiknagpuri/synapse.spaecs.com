import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import JSZip from "jszip";
import {
  parseConnectionsCsv,
  parseMessagesCsv,
  parseInvitationsCsv,
  parseProfileCsv,
  buildMessageCountMap,
} from "@/lib/integrations/linkedin-zip";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const isZip =
      file.name.endsWith(".zip") || file.type === "application/zip";

    if (!isZip && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Please upload a LinkedIn data export ZIP or Connections CSV." },
        { status: 400 }
      );
    }

    // CSV-only fallback
    if (!isZip) {
      const csvText = await file.text();
      const { parseLinkedInCSV } = await import(
        "@/lib/integrations/linkedin"
      );
      const contacts = parseLinkedInCSV(csvText);

      const records = contacts
        .map((lc) => ({
          user_id: user.id,
          full_name: `${lc.firstName} ${lc.lastName}`.trim(),
          email: lc.email || null,
          company: lc.company || null,
          title: lc.position || null,
          linkedin_url: lc.url || null,
          source: "linkedin" as const,
          last_interaction_at: lc.connectedOn
            ? new Date(lc.connectedOn).toISOString()
            : null,
        }))
        .filter((r) => r.full_name);

      let created = 0;
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        // Use linkedin_url for upsert (most LinkedIn contacts have URL but not email)
        const withUrl = batch.filter((r) => r.linkedin_url);
        const withoutUrl = batch.filter((r) => !r.linkedin_url);

        if (withUrl.length) {
          const { data } = await supabase
            .from("contacts")
            .upsert(withUrl, { onConflict: "user_id,linkedin_url", ignoreDuplicates: false })
            .select("id");
          created += data?.length || 0;
        }
        if (withoutUrl.length) {
          const { data } = await supabase
            .from("contacts")
            .insert(withoutUrl)
            .select("id");
          created += data?.length || 0;
        }
      }

      return NextResponse.json({
        success: true,
        contacts_imported: created,
        contacts_skipped: records.length - created,
        total_connections: contacts.length,
        messages_parsed: 0,
        invitations_parsed: 0,
        interactions_created: 0,
        profile_name: null,
      });
    }

    // --- ZIP processing ---
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const zipEntries = Object.keys(zip.files).filter(
      (f) => !zip.files[f].dir
    );
    console.log("LinkedIn ZIP entries:", zipEntries);

    async function extractFile(name: string): Promise<string | null> {
      const nameLower = name.toLowerCase();
      let zipFile = zip.file(name);
      if (!zipFile) {
        const entries = Object.keys(zip.files);
        const match = entries.find((e) => {
          const eLower = e.toLowerCase();
          return eLower === nameLower || eLower.endsWith("/" + nameLower);
        });
        if (match) zipFile = zip.file(match);
      }
      if (!zipFile) return null;
      return zipFile.async("string");
    }

    const connectionsText = await extractFile("Connections.csv");
    const messagesText = await extractFile("messages.csv");
    const invitationsText = await extractFile("Invitations.csv");
    const profileText = await extractFile("Profile.csv");

    if (!connectionsText) {
      return NextResponse.json(
        {
          error: `Could not find Connections.csv in the ZIP. Files found: ${zipEntries.slice(0, 15).join(", ")}${zipEntries.length > 15 ? "..." : ""}`,
        },
        { status: 400 }
      );
    }

    const connections = parseConnectionsCsv(connectionsText);
    const messages = messagesText ? parseMessagesCsv(messagesText) : [];
    const invitations = invitationsText
      ? parseInvitationsCsv(invitationsText)
      : [];
    const profile = profileText ? parseProfileCsv(profileText) : null;

    let ownerProfileUrl = "";
    if (profile) {
      const outgoing = invitations.find((inv) => inv.direction === "OUTGOING");
      if (outgoing?.inviterProfileUrl) {
        ownerProfileUrl = outgoing.inviterProfileUrl;
      }
    }

    const messageMap = buildMessageCountMap(messages, ownerProfileUrl);

    // Create ingestion job
    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "linkedin",
        status: "processing",
        total_items: connections.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // --- Batch insert contacts ---
    const BATCH_SIZE = 50;
    let contactsCreated = 0;
    let contactsSkipped = 0;
    let interactionsCreated = 0;

    // Prepare all contact records
    const contactRecords: {
      record: Record<string, unknown>;
      conn: (typeof connections)[0];
      msgStats: { count: number; lastDate: string; lastSnippet: string } | null;
    }[] = [];

    for (const conn of connections) {
      const fullName = `${conn.firstName} ${conn.lastName}`.trim();
      if (!fullName) {
        contactsSkipped++;
        continue;
      }

      const normalizedUrl = conn.url
        ? conn.url
            .replace(/^https?:\/\/(www\.)?linkedin\.com/, "")
            .replace(/\/$/, "")
        : "";

      const msgStats = normalizedUrl ? messageMap.get(normalizedUrl) || null : null;

      let lastInteraction = conn.connectedOn
        ? new Date(conn.connectedOn).toISOString()
        : null;
      if (msgStats?.lastDate && (!lastInteraction || msgStats.lastDate > lastInteraction)) {
        lastInteraction = msgStats.lastDate;
      }

      contactRecords.push({
        record: {
          user_id: user.id,
          full_name: fullName,
          email: conn.email || null,
          company: conn.company || null,
          title: conn.position || null,
          linkedin_url: conn.url || null,
          source: "linkedin",
          last_interaction_at: lastInteraction,
          interaction_count: msgStats?.count || 0,
        },
        conn,
        msgStats,
      });
    }

    // Split: contacts with linkedin_url (batch upsert via partial unique index) vs without
    const withUrl = contactRecords.filter((r) => r.record.linkedin_url);
    const withoutUrl = contactRecords.filter((r) => !r.record.linkedin_url);

    const contactIdMap = new Map<string, string>(); // linkedin_url -> contact_id

    // Batch upsert contacts that have a linkedin_url (virtually all LinkedIn connections)
    for (let i = 0; i < withUrl.length; i += BATCH_SIZE) {
      const batch = withUrl.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("contacts")
        .upsert(
          batch.map((b) => b.record),
          { onConflict: "user_id,linkedin_url", ignoreDuplicates: false }
        )
        .select("id, linkedin_url");

      if (!error && data) {
        contactsCreated += data.length;
        for (const d of data) {
          if (d.linkedin_url) contactIdMap.set(d.linkedin_url, d.id);
        }
      } else if (error) {
        console.error("Batch upsert error:", error.message);
        // Fallback: insert one by one
        for (const b of batch) {
          const { data: upserted, error: singleErr } = await supabase
            .from("contacts")
            .upsert(b.record, { onConflict: "user_id,linkedin_url", ignoreDuplicates: false })
            .select("id, linkedin_url")
            .single();
          if (upserted) {
            contactsCreated++;
            if (upserted.linkedin_url) contactIdMap.set(upserted.linkedin_url, upserted.id);
          } else {
            console.error("Single upsert error:", singleErr?.message, b.record.full_name);
            contactsSkipped++;
          }
        }
      }
    }

    // Handle the rare contacts without linkedin_url (insert individually)
    for (const b of withoutUrl) {
      const { data: inserted } = await supabase
        .from("contacts")
        .insert(b.record)
        .select("id")
        .single();
      if (inserted) {
        contactsCreated++;
      } else {
        contactsSkipped++;
      }
    }

    // --- Batch insert interactions ---
    const interactionRecords: Record<string, unknown>[] = [];

    for (const { conn, msgStats } of contactRecords) {
      const contactId = conn.url ? contactIdMap.get(conn.url) : null;
      if (!contactId) continue;

      interactionRecords.push({
        contact_id: contactId,
        user_id: user.id,
        platform: "linkedin",
        type: "connection",
        subject: "Connected on LinkedIn",
        snippet: `${conn.position || ""} at ${conn.company || ""}`.trim() || null,
        occurred_at: conn.connectedOn
          ? new Date(conn.connectedOn).toISOString()
          : new Date().toISOString(),
      });

      if (msgStats && msgStats.count > 0) {
        interactionRecords.push({
          contact_id: contactId,
          user_id: user.id,
          platform: "linkedin",
          type: "email_sent",
          subject: `${msgStats.count} LinkedIn messages`,
          snippet: msgStats.lastSnippet || null,
          occurred_at: msgStats.lastDate,
        });
      }
    }

    // Batch insert interactions
    for (let i = 0; i < interactionRecords.length; i += BATCH_SIZE) {
      const batch = interactionRecords.slice(i, i + BATCH_SIZE);
      const { data } = await supabase.from("interactions").insert(batch).select("id");
      interactionsCreated += data?.length || 0;
    }

    // Complete ingestion job
    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        processed_items: contactsCreated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      contacts_imported: contactsCreated,
      contacts_skipped: contactsSkipped,
      total_connections: connections.length,
      messages_parsed: messages.length,
      invitations_parsed: invitations.length,
      interactions_created: interactionsCreated,
      profile_name: profile?.name || null,
    });
  } catch (err: unknown) {
    console.error("LinkedIn ZIP ingestion error:", err);
    const message =
      err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
