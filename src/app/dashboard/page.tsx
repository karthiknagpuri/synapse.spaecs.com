import { createClient } from "@/lib/supabase/server";
import { SearchHero } from "@/components/search-hero";
import { DashboardGrid } from "@/components/dashboard-grid";
import { RoleBento } from "@/components/role-bento";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    contactsResult,
    integrationsResult,
    researchResult,
    scoreResult,
    activeResult,
    recentContactsResult,
    weeklyNewResult,
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id),
    supabase
      .from("integrations")
      .select("platform, status")
      .eq("user_id", user?.id)
      .eq("status", "active"),
    supabase
      .from("research_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("status", "completed"),
    supabase
      .from("contacts")
      .select("relationship_score")
      .eq("user_id", user?.id),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .gte("last_interaction_at", thirtyDaysAgo),
    supabase
      .from("contacts")
      .select("id, full_name, avatar_url, company, title, relationship_score, last_interaction_at")
      .eq("user_id", user?.id)
      .order("last_interaction_at", { ascending: false })
      .limit(5),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .gte("created_at", sevenDaysAgo),
  ]);

  const contactCount = contactsResult.count || 0;
  const accountCount = integrationsResult.data?.length || 0;
  const researchCount = researchResult.count || 0;
  const activeCount = activeResult.count || 0;
  const weeklyNew = weeklyNewResult.count || 0;
  const recentContacts = recentContactsResult.data || [];

  const scores = (scoreResult.data || []).map(
    (c) => c.relationship_score || 0
  );
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "";

  return (
    <div className="max-w-3xl mx-auto">
      <SearchHero />
      <DashboardGrid
        firstName={firstName}
        stats={{
          contacts: contactCount,
          connectors: accountCount,
          researched: researchCount,
          avgScore,
          active: activeCount,
          weeklyNew,
        }}
        recentContacts={recentContacts}
      />
      <RoleBento />
    </div>
  );
}
