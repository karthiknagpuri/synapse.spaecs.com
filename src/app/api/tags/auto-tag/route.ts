import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ContactForTagging {
  id: string;
  full_name: string;
  title: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  tags: string[];
}

interface TagAssignment {
  contact_id: string;
  tags: string[];
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch tag definitions where auto_assign = true
  const { data: tagDefs, error: tagError } = await supabase
    .from("tag_definitions")
    .select("*")
    .eq("user_id", user.id)
    .eq("auto_assign", true);

  if (tagError) {
    return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  if (!tagDefs || tagDefs.length === 0) {
    return NextResponse.json(
      { error: "No auto-assign tags defined. Create tags with auto-assign enabled first." },
      { status: 400 }
    );
  }

  // 2. Fetch all contacts for the user
  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .select("id, full_name, title, company, location, bio, tags")
    .eq("user_id", user.id);

  if (contactError) {
    return NextResponse.json({ error: contactError.message }, { status: 500 });
  }

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ tagged: 0, total: 0 });
  }

  // 3. Build tag definitions context for the prompt
  const tagContext = tagDefs
    .map((t) => `- "${t.name}": ${t.criteria}`)
    .join("\n");

  // 4. Process contacts in batches of 20
  const BATCH_SIZE = 20;
  let totalTagged = 0;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE) as ContactForTagging[];

    const contactsPrompt = batch
      .map(
        (c) =>
          `{ "id": "${c.id}", "name": "${c.full_name}", "title": "${c.title || ""}", "company": "${c.company || ""}", "location": "${c.location || ""}", "bio": "${c.bio || ""}" }`
      )
      .join(",\n");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a contact classifier. Given contact information and tag definitions with criteria, assign matching tags to each contact. Only assign a tag if the contact clearly matches the criteria. A contact can have zero or multiple tags. Return valid JSON in this exact format: { "assignments": [{ "contact_id": "...", "tags": ["tag1", "tag2"] }] }`,
          },
          {
            role: "user",
            content: `Tag definitions:\n${tagContext}\n\nContacts to classify:\n[${contactsPrompt}]\n\nAssign matching tags to each contact based on the criteria above. Return JSON with the assignments array.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const result = JSON.parse(content) as { assignments: TagAssignment[] };

      if (!result.assignments || !Array.isArray(result.assignments)) continue;

      // 5. Update each contact's tags in Supabase
      for (const assignment of result.assignments) {
        if (!assignment.tags || assignment.tags.length === 0) continue;

        // Find the contact to merge with existing tags
        const contact = batch.find((c) => c.id === assignment.contact_id);
        if (!contact) continue;

        // Merge new tags with existing, deduplicating
        const existingTags = contact.tags || [];
        const mergedTags = [...new Set([...existingTags, ...assignment.tags])];

        const { error: updateError } = await supabase
          .from("contacts")
          .update({ tags: mergedTags, updated_at: new Date().toISOString() })
          .eq("id", assignment.contact_id)
          .eq("user_id", user.id);

        if (!updateError) {
          totalTagged++;
        }
      }
    } catch (err) {
      // Log but continue with next batch
      console.error("Auto-tag batch error:", err);
      continue;
    }
  }

  return NextResponse.json({ tagged: totalTagged, total: contacts.length });
}
