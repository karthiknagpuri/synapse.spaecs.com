import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ENRICHABLE_FIELDS = [
  "company",
  "title",
  "location",
  "bio",
  "linkedin_url",
  "twitter_handle",
] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Identify missing fields
  const missingFields = ENRICHABLE_FIELDS.filter(
    (f) => !contact[f] || (typeof contact[f] === "string" && !contact[f].trim())
  );

  if (missingFields.length === 0) {
    return NextResponse.json({
      success: true,
      suggestions: {},
      message: "All fields are already populated.",
    });
  }

  // Need at least a name + some context to enrich
  if (!contact.full_name) {
    return NextResponse.json(
      { error: "Contact needs at least a name for enrichment." },
      { status: 422 }
    );
  }

  const knownInfo = [
    `Name: ${contact.full_name}`,
    contact.email && `Email: ${contact.email}`,
    contact.company && `Company: ${contact.company}`,
    contact.title && `Title: ${contact.title}`,
    contact.location && `Location: ${contact.location}`,
    contact.phone && `Phone: ${contact.phone}`,
    contact.bio && `Bio: ${contact.bio}`,
    contact.linkedin_url && `LinkedIn: ${contact.linkedin_url}`,
    contact.twitter_handle && `Twitter: ${contact.twitter_handle}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a professional contact data enrichment assistant. Given the known information about a person, fill in missing professional details. Only return data you are reasonably confident about based on the person's name, email domain, and any other context. Return a JSON object with only the fields you can fill in. Do not guess or fabricate information. Possible fields: ${missingFields.join(", ")}.`,
        },
        {
          role: "user",
          content: `Here is what I know about this contact:\n${knownInfo}\n\nPlease suggest values for these missing fields: ${missingFields.join(", ")}`,
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    const parsed = content ? JSON.parse(content) : {};

    // Filter to only enrichable fields that were actually missing
    const suggestions: Record<string, string> = {};
    for (const field of missingFields) {
      if (parsed[field] && typeof parsed[field] === "string" && parsed[field].trim()) {
        suggestions[field] = parsed[field].trim();
      }
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error("Enrichment failed:", error);
    return NextResponse.json(
      { error: "Failed to enrich contact data. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fields } = body;

  if (!fields || typeof fields !== "object" || Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "No fields provided" },
      { status: 400 }
    );
  }

  // Only allow updating enrichable fields
  const allowedFields: Record<string, string> = {};
  for (const field of ENRICHABLE_FIELDS) {
    if (fields[field] && typeof fields[field] === "string") {
      allowedFields[field] = fields[field].trim();
    }
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("contacts")
    .update(allowedFields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, updated: allowedFields });
}
