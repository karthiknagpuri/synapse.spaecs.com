import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLinkedInCSV } from "@/lib/integrations/linkedin";

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

    const csvText = await file.text();
    const linkedInContacts = parseLinkedInCSV(csvText);

    const { data: job } = await supabase
      .from("ingestion_jobs")
      .insert({
        user_id: user.id,
        platform: "linkedin",
        status: "processing",
        total_items: linkedInContacts.length,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    let processed = 0;

    for (const lc of linkedInContacts) {
      const fullName = `${lc.firstName} ${lc.lastName}`.trim();

      const { data: contact } = await supabase
        .from("contacts")
        .upsert(
          {
            user_id: user.id,
            email: lc.email || null,
            full_name: fullName,
            company: lc.company || null,
            title: lc.position || null,
            linkedin_url: lc.url || null,
            source: "linkedin",
            last_interaction_at: lc.connectedOn
              ? new Date(lc.connectedOn).toISOString()
              : null,
          },
          {
            onConflict: "user_id,email",
            ignoreDuplicates: !lc.email,
          }
        )
        .select("id")
        .single();

      if (contact) {
        await supabase.from("interactions").insert({
          contact_id: contact.id,
          user_id: user.id,
          platform: "linkedin",
          type: "connection",
          subject: `Connected on LinkedIn`,
          snippet: `${lc.position} at ${lc.company}`,
          occurred_at: lc.connectedOn
            ? new Date(lc.connectedOn).toISOString()
            : new Date().toISOString(),
        });
      }

      processed++;
    }

    await supabase
      .from("ingestion_jobs")
      .update({
        status: "completed",
        processed_items: processed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job?.id);

    return NextResponse.json({
      success: true,
      contacts_imported: processed,
      total_in_csv: linkedInContacts.length,
    });
  } catch (err: any) {
    console.error("LinkedIn ingestion error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 }
    );
  }
}
