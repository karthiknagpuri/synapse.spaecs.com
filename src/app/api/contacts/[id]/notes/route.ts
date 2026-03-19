import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// GET /api/contacts/:id/notes — list all notes for a contact
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: notes, error } = await supabase
      .from("contact_notes")
      .select("*")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: notes ?? [] });
  } catch (error) {
    console.error("Notes list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/:id/notes — create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const { data: note, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id: id,
        user_id: user.id,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Classify note as interaction in the background (non-blocking)
    let interaction = null;
    try {
      interaction = await classifyAndCreateInteraction(
        content.trim(),
        id,
        user.id,
        supabase
      );
    } catch (err) {
      console.error("Interaction classification failed:", err);
    }

    return NextResponse.json({ note, interaction }, { status: 201 });
  } catch (error) {
    console.error("Note create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Use GPT-4o-mini to classify if a note describes an interaction
async function classifyAndCreateInteraction(
  content: string,
  contactId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You classify notes about contacts. Determine if a note describes an interaction (meeting, call, email, connection, etc.).

Return JSON:
{
  "is_interaction": true/false,
  "type": "meeting" | "call" | "email_sent" | "email_received" | "connection" | "meeting_note" | "note",
  "subject": "brief subject line or null",
  "occurred_at": "ISO date string or null (if a date/time is mentioned)"
}

Rules:
- "Had coffee with...", "Met at...", "Lunch with..." → meeting
- "Called about...", "Phone call regarding..." → call
- "Sent email about...", "Emailed regarding..." → email_sent
- "Got an email from...", "Received message about..." → email_received
- "Connected on LinkedIn", "Met at conference" → connection
- "Notes from our meeting...", "Meeting takeaways..." → meeting_note
- General observations, reminders, or non-interaction context → is_interaction: false
- If no date mentioned, occurred_at should be null (we'll use current time)
- Be conservative: only classify as interaction if it clearly describes one`,
      },
      { role: "user", content },
    ],
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  if (!result.is_interaction) return null;

  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert({
      contact_id: contactId,
      user_id: userId,
      platform: "manual",
      type: result.type || "note",
      subject: result.subject || null,
      snippet: content.slice(0, 200),
      occurred_at: result.occurred_at || new Date().toISOString(),
      metadata: { source: "note_classification" },
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create interaction from note:", error);
    return null;
  }

  // Update contact's last_interaction_at
  const { data: contact } = await supabase
    .from("contacts")
    .select("interaction_count")
    .eq("id", contactId)
    .single();

  await supabase
    .from("contacts")
    .update({
      last_interaction_at: new Date().toISOString(),
      interaction_count: (contact?.interaction_count || 0) + 1,
    })
    .eq("id", contactId);

  return interaction;
}
