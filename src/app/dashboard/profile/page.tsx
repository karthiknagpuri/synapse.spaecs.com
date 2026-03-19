import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import {
  Mail,
  Calendar,
  Users,
  Telescope,
  Plug,
  BarChart3,
  Activity,
  Settings,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const name = user.user_metadata?.full_name || "";
  const email = user.email || "";
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

  const initials = name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    profileResult,
    contactsResult,
    researchResult,
    integrationsResult,
    activeResult,
    scoreResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("research_profiles")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("integrations")
      .select("platform, status")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("last_interaction_at", thirtyDaysAgo),
    supabase
      .from("contacts")
      .select("relationship_score")
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const contactCount = contactsResult.count || 0;
  const researchCount = researchResult.count || 0;
  const activeIntegrations = integrationsResult.data || [];
  const activeCount = activeResult.count || 0;

  const scores = (scoreResult.data || []).map(
    (c) => c.relationship_score || 0
  );
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const connectedPlatforms = activeIntegrations.map((i) => i.platform);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="aspect-square size-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-medium">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-[28px] text-gray-900 leading-tight">
              {name || "Your Profile"}
            </h1>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                Member since {memberSince}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-900 text-white uppercase tracking-wider">
                {profile?.plan || "free"}
              </span>
              {connectedPlatforms.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <Shield className="h-3 w-3" />
                  {connectedPlatforms.length} connected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div>
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3 px-1">
          Your Network
        </h2>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            {
              label: "Contacts",
              value: contactCount,
              icon: Users,
              href: "/dashboard/contacts",
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
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex flex-col items-center gap-0.5 py-4 px-2 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
            >
              <stat.icon className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
              <p className="text-xl font-semibold text-gray-900 tracking-tight tabular-nums leading-none mt-1.5">
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-300 uppercase tracking-widest font-medium mt-1 group-hover:text-gray-400 transition-colors">
                {stat.label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div>
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3 px-1">
          Connected Accounts
        </h2>
        <div className="rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] divide-y divide-gray-100/60">
          {[
            {
              platform: "google",
              label: "Google",
              description: "Gmail & Calendar",
              icon: Mail,
            },
            {
              platform: "linkedin",
              label: "LinkedIn",
              description: "Professional network",
              icon: Users,
            },
          ].map((account) => {
            const isConnected = connectedPlatforms.includes(account.platform);
            return (
              <div
                key={account.platform}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-50">
                  <account.icon className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {account.label}
                  </p>
                  <p className="text-xs text-gray-400">{account.description}</p>
                </div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Connected
                  </span>
                ) : (
                  <Link
                    href="/dashboard/integrations"
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                  >
                    Connect
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3 px-1">
          Quick Actions
        </h2>
        <div className="rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] divide-y divide-gray-100/60">
          {[
            {
              label: "Manage Connectors",
              description: "Connect Gmail, Calendar, LinkedIn",
              icon: Plug,
              href: "/dashboard/integrations",
            },
            {
              label: "Tags & Auto-Tagging",
              description: "Define tags and AI classification rules",
              icon: Calendar,
              href: "/dashboard/settings",
            },
            {
              label: "Account Settings",
              description: "Privacy, data management, sign out",
              icon: Settings,
              href: "/dashboard/settings",
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 px-5 py-4 group hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <action.icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {action.label}
                </p>
                <p className="text-xs text-gray-400">{action.description}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
