import { createClient } from "@/lib/supabase/server";
import { SearchHero } from "@/components/search-hero";
import { PeopleBento } from "@/components/people-bento";
import { DashboardInsights } from "@/components/dashboard-insights";
import { Users, Plug, Telescope, BarChart3, Activity } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [contactsResult, integrationsResult, researchResult, scoreResult, activeResult] =
    await Promise.all([
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
    ]);

  const contactCount = contactsResult.count || 0;
  const accountCount = integrationsResult.data?.length || 0;
  const researchCount = researchResult.count || 0;
  const activeCount = activeResult.count || 0;

  const scores = (scoreResult.data || []).map((c) => c.relationship_score || 0);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const stats = [
    {
      label: "Connections",
      value: contactCount,
      icon: Users,
      href: "/dashboard/contacts",
    },
    {
      label: "Connectors",
      value: accountCount,
      icon: Plug,
      href: "/dashboard/integrations",
    },
    {
      label: "Researched",
      value: researchCount,
      icon: Telescope,
      href: "/dashboard/research",
    },
    {
      label: "Avg Score",
      value: avgScore,
      icon: BarChart3,
      href: "/dashboard/contacts",
    },
    {
      label: "Active",
      value: activeCount,
      icon: Activity,
      href: "/dashboard/contacts",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SearchHero />

      {/* People Bento Grid */}
      <PeopleBento />

      {/* Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-1.5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group flex flex-col items-center gap-0.5 py-3 px-2 sm:py-4 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
          >
            <stat.icon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
            <p className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight tabular-nums leading-none mt-1.5">
              {stat.value}
            </p>
            <p className="text-[10px] sm:text-[10px] text-gray-300 uppercase tracking-widest font-medium mt-1 group-hover:text-gray-400 transition-colors">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      <DashboardInsights />
    </div>
  );
}
