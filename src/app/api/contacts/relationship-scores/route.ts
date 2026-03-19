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

  // Fetch all contacts for this user
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, interaction_count, last_interaction_at")
    .eq("user_id", user.id);

  if (contactsError) {
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const contactIds = contacts.map((c) => c.id);

  // Fetch interaction diversity (distinct types per contact)
  const { data: diversityData, error: diversityError } = await supabase
    .from("interactions")
    .select("contact_id, type")
    .eq("user_id", user.id)
    .in("contact_id", contactIds);

  if (diversityError) {
    return NextResponse.json(
      { error: "Failed to fetch interaction diversity" },
      { status: 500 }
    );
  }

  // Fetch recent interactions (last 30 days) per contact
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentData, error: recentError } = await supabase
    .from("interactions")
    .select("contact_id")
    .eq("user_id", user.id)
    .in("contact_id", contactIds)
    .gte("occurred_at", thirtyDaysAgo.toISOString());

  if (recentError) {
    return NextResponse.json(
      { error: "Failed to fetch recent interactions" },
      { status: 500 }
    );
  }

  // Build lookup maps
  const diversityMap = new Map<string, Set<string>>();
  for (const row of diversityData || []) {
    if (!diversityMap.has(row.contact_id)) {
      diversityMap.set(row.contact_id, new Set());
    }
    diversityMap.get(row.contact_id)!.add(row.type);
  }

  const recentCountMap = new Map<string, number>();
  for (const row of recentData || []) {
    recentCountMap.set(
      row.contact_id,
      (recentCountMap.get(row.contact_id) || 0) + 1
    );
  }

  const now = Date.now();
  const updatedAt = new Date().toISOString();
  let updated = 0;

  // Calculate scores and batch update
  for (const contact of contacts) {
    // Base score: interaction_count weighted (max 30 points for 50+ interactions)
    const interactionCount = contact.interaction_count || 0;
    const baseScore = Math.min(30, Math.round((interactionCount / 50) * 30));

    // Recency score: days since last_interaction_at (max 40 points, decays linearly over 90 days)
    let recencyScore = 0;
    if (contact.last_interaction_at) {
      const lastInteraction = new Date(contact.last_interaction_at).getTime();
      const daysSince = Math.max(
        0,
        (now - lastInteraction) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 90) {
        recencyScore = Math.round(40 * (1 - daysSince / 90));
      }
    }

    // Diversity score: distinct interaction types (max 15 points for 3+ types)
    const distinctTypes = diversityMap.get(contact.id)?.size || 0;
    const diversityScore = Math.min(15, Math.round((distinctTypes / 3) * 15));

    // Frequency score: interactions in last 30 days (max 15 points for 10+ recent)
    const recentCount = recentCountMap.get(contact.id) || 0;
    const frequencyScore = Math.min(
      15,
      Math.round((recentCount / 10) * 15)
    );

    const totalScore = Math.min(
      100,
      baseScore + recencyScore + diversityScore + frequencyScore
    );

    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        relationship_score: totalScore,
        score_updated_at: updatedAt,
      })
      .eq("id", contact.id)
      .eq("user_id", user.id);

    if (!updateError) {
      updated++;
    }
  }

  return NextResponse.json({ updated });
}
