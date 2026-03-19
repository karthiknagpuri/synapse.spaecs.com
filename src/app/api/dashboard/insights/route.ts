import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    reconnectResult,
    recentActivityResult,
    scoreStatsResult,
    dueRemindersResult,
    distributionResult,
    growthResult,
    sourceResult,
  ] = await Promise.all([
    // Reconnect Suggestions: score > 30, last interaction > 30 days ago
    supabase
      .from("contacts")
      .select("id, full_name, avatar_url, last_interaction_at, relationship_score, company, title")
      .eq("user_id", user.id)
      .gt("relationship_score", 30)
      .lt("last_interaction_at", thirtyDaysAgo.toISOString())
      .order("relationship_score", { ascending: false })
      .limit(5),

    // Recent Activity: latest interactions with contact info
    supabase
      .from("interactions")
      .select("id, type, platform, subject, occurred_at, contact_id, contacts!inner(full_name, avatar_url)")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(10),

    // Score stats: avg score and count of active (score > 50)
    supabase
      .from("contacts")
      .select("relationship_score")
      .eq("user_id", user.id),

    // Due reminders
    supabase
      .from("contacts")
      .select("id, full_name, avatar_url, next_reminder_at, reminder_frequency, relationship_score, company, title")
      .eq("user_id", user.id)
      .not("next_reminder_at", "is", null)
      .lte("next_reminder_at", now.toISOString())
      .order("next_reminder_at", { ascending: true })
      .limit(5),

    // Score distribution for all contacts
    supabase
      .from("contacts")
      .select("relationship_score")
      .eq("user_id", user.id),

    // Network growth: contacts grouped by month
    supabase
      .from("contacts")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    // Source breakdown
    supabase
      .from("contacts")
      .select("source")
      .eq("user_id", user.id),
  ]);

  // Compute fading relationships
  const allContacts = distributionResult.data || [];

  // Fetch contacts with scores and interaction data for fading detection
  const { data: fadingCandidates } = await supabase
    .from("contacts")
    .select("id, full_name, avatar_url, last_interaction_at, relationship_score, interaction_count, company, title")
    .eq("user_id", user.id)
    .gt("relationship_score", 0)
    .not("last_interaction_at", "is", null)
    .order("relationship_score", { ascending: false });

  // Calculate fading: contacts where recency component has decayed significantly
  const fadingRelationships = (fadingCandidates || [])
    .map((contact) => {
      const lastInteraction = new Date(contact.last_interaction_at!).getTime();
      const daysSince = Math.max(0, (now.getTime() - lastInteraction) / (1000 * 60 * 60 * 24));

      // Current recency score (same algorithm as relationship-scores/route.ts)
      let currentRecency = 0;
      if (daysSince <= 90) {
        currentRecency = Math.round(40 * (1 - daysSince / 90));
      }

      // What recency would have been 30 days ago
      const daysSince30DaysAgo = Math.max(0, daysSince - 30);
      let pastRecency = 0;
      if (daysSince30DaysAgo <= 90) {
        pastRecency = Math.round(40 * (1 - daysSince30DaysAgo / 90));
      }

      const recencyDrop = pastRecency - currentRecency;

      return {
        ...contact,
        days_since_contact: Math.round(daysSince),
        recency_drop: recencyDrop,
      };
    })
    .filter((c) => c.recency_drop > 5)
    .sort((a, b) => b.recency_drop - a.recency_drop)
    .slice(0, 5);

  // Compute score stats
  const scores = (scoreStatsResult.data || []).map((c) => c.relationship_score || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const activeCount = scores.filter((s) => s > 50).length;

  // Compute score distribution buckets
  const distribution = {
    new: 0,        // 0-20
    acquaintance: 0, // 21-40
    familiar: 0,   // 41-60
    close: 0,      // 61-80
    inner_circle: 0, // 81-100
  };
  for (const contact of allContacts) {
    const s = contact.relationship_score || 0;
    if (s <= 20) distribution.new++;
    else if (s <= 40) distribution.acquaintance++;
    else if (s <= 60) distribution.familiar++;
    else if (s <= 80) distribution.close++;
    else distribution.inner_circle++;
  }

  // Compute network growth by month
  const monthCounts: Record<string, number> = {};
  for (const contact of growthResult.data || []) {
    const month = contact.created_at.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  }
  const networkGrowth = Object.entries(monthCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([month, count]) => ({ month, count }));

  // Compute source breakdown
  const sourceCounts: Record<string, number> = {};
  for (const contact of sourceResult.data || []) {
    sourceCounts[contact.source] = (sourceCounts[contact.source] || 0) + 1;
  }
  const sourceBreakdown = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Format recent activity (deduplicate by contact + type + date)
  const seenActivity = new Set<string>();
  const recentActivity: any[] = [];
  for (const row of recentActivityResult.data || []) {
    const interaction = row as any;
    const key = `${interaction.contact_id}-${interaction.type}-${interaction.occurred_at}`;
    if (seenActivity.has(key)) continue;
    seenActivity.add(key);
    const contact = Array.isArray(interaction.contacts)
      ? interaction.contacts[0]
      : interaction.contacts;
    recentActivity.push({
      id: interaction.id,
      type: interaction.type,
      platform: interaction.platform,
      subject: interaction.subject,
      occurred_at: interaction.occurred_at,
      contact_id: interaction.contact_id,
      contact_name: contact?.full_name || "Unknown",
      contact_avatar: contact?.avatar_url || null,
    });
  }

  return NextResponse.json({
    reconnect: reconnectResult.data || [],
    fading: fadingRelationships,
    recent_activity: recentActivity,
    due_reminders: dueRemindersResult.data || [],
    stats: {
      avg_score: avgScore,
      active_count: activeCount,
    },
    network: {
      distribution,
      growth: networkGrowth,
      sources: sourceBreakdown,
    },
  });
}
