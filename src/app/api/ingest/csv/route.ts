import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CsvContact {
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  location?: string;
  tags?: string[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const contacts: CsvContact[] = body.contacts;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json(
      { error: "No contacts provided" },
      { status: 400 }
    );
  }

  let created = 0;
  let skipped = 0;

  for (const contact of contacts) {
    if (!contact.full_name?.trim()) {
      skipped++;
      continue;
    }

    const record = {
      user_id: user.id,
      full_name: contact.full_name.trim(),
      email: contact.email?.trim() || null,
      phone: contact.phone?.trim() || null,
      company: contact.company?.trim() || null,
      title: contact.title?.trim() || null,
      location: contact.location?.trim() || null,
      tags: contact.tags || [],
      source: "manual" as const,
    };

    // Upsert by email if available, otherwise insert
    if (record.email) {
      const { error } = await supabase.from("contacts").upsert(record, {
        onConflict: "user_id,email",
        ignoreDuplicates: true,
      });
      if (!error) created++;
      else skipped++;
    } else {
      const { error } = await supabase.from("contacts").insert(record);
      if (!error) created++;
      else skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    contacts_created: created,
    contacts_skipped: skipped,
    total: contacts.length,
  });
}
