import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all contacts
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, interaction_count, last_interaction_at, source")
    .eq("user_id", user.id);

  if (contactsError || !contacts || contacts.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const contactIds = contacts.map((c) => c.id);

  // Fetch all interactions for scoring
  const { data: allInteractions } = await supabase
    .from("interactions")
    .select("contact_id, type, platform, occurred_at")
    .eq("user_id", user.id)
    .in("contact_id", contactIds);

  // Build per-contact interaction data
  const interactionsByContact = new Map<
    string,
    { type: string; platform: string; occurred_at: string }[]
  >();

  for (const row of allInteractions || []) {
    if (!interactionsByContact.has(row.contact_id)) {
      interactionsByContact.set(row.contact_id, []);
    }
    interactionsByContact.get(row.contact_id)!.push(row);
  }

  const now = Date.now();
  const updatedAt = new Date().toISOString();
  let updated = 0;

  for (const contact of contacts) {
    const interactions = interactionsByContact.get(contact.id) || [];
    const score = calculateConnectionStrength(contact, interactions, now);

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        relationship_score: score,
        score_updated_at: updatedAt,
      })
      .eq("id", contact.id)
      .eq("user_id", user.id);

    if (!updateError) updated++;
  }

  return NextResponse.json({ updated });
}

/**
 * Enhanced connection strength algorithm.
 *
 * Scoring breakdown (max 100):
 *   Volume (20):     Total interaction count, diminishing returns
 *   Recency (25):    Exponential decay over 90 days from last interaction
 *   Frequency (20):  Weighted recent interactions (7d = 3x, 30d = 2x, 90d = 1x)
 *   Diversity (15):  Distinct interaction types (email, meeting, call, etc.)
 *   Platform (10):   Number of distinct platforms (multi-channel = stronger)
 *   Bidirectional (10): Ratio of sent vs received (balanced = stronger)
 */
function calculateConnectionStrength(
  contact: {
    interaction_count: number | null;
    last_interaction_at: string | null;
    source: string | null;
  },
  interactions: { type: string; platform: string; occurred_at: string }[],
  now: number
): number {
  if (interactions.length === 0) {
    // Minimal score for imported contacts with no interactions
    return contact.source === "manual" ? 5 : 2;
  }

  // ── Volume (0-20) — diminishing returns via log scale ──
  const count = interactions.length;
  const volumeScore = Math.min(20, Math.round(20 * (Math.log10(count + 1) / Math.log10(100))));

  // ── Recency (0-25) — exponential decay over 90 days ──
  let recencyScore = 0;
  if (contact.last_interaction_at) {
    const daysSince = Math.max(
      0,
      (now - new Date(contact.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 90) {
      // Exponential decay: e^(-daysSince/30) gives more weight to very recent
      recencyScore = Math.round(25 * Math.exp(-daysSince / 30));
    }
  }

  // ── Frequency (0-20) — time-weighted recent interactions ──
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  let weightedRecent = 0;
  for (const i of interactions) {
    const age = now - new Date(i.occurred_at).getTime();
    if (age <= sevenDays) weightedRecent += 3;
    else if (age <= thirtyDays) weightedRecent += 2;
    else if (age <= ninetyDays) weightedRecent += 1;
  }
  const frequencyScore = Math.min(20, Math.round((weightedRecent / 30) * 20));

  // ── Diversity (0-15) — distinct interaction types ──
  const types = new Set(interactions.map((i) => i.type));
  const diversityScore = Math.min(15, Math.round((types.size / 4) * 15));

  // ── Platform Diversity (0-10) — multi-channel connections are stronger ──
  const platforms = new Set(interactions.map((i) => i.platform));
  const platformScore = Math.min(10, Math.round((platforms.size / 3) * 10));

  // ── Bidirectional (0-10) — balanced send/receive = stronger ──
  const sent = interactions.filter(
    (i) => i.type === "email_sent" || i.type === "call" || i.type === "note"
  ).length;
  const received = interactions.filter(
    (i) => i.type === "email_received" || i.type === "meeting"
  ).length;
  const total = sent + received;
  let bidirectionalScore = 0;
  if (total > 0) {
    const ratio = Math.min(sent, received) / Math.max(sent, received, 1);
    bidirectionalScore = Math.round(10 * ratio);
  }

  const totalScore = Math.min(
    100,
    volumeScore +
      recencyScore +
      frequencyScore +
      diversityScore +
      platformScore +
      bidirectionalScore
  );

  return totalScore;
}
