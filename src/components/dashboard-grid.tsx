"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RelationshipScore } from "@/components/relationship-score";
import {
  Users,
  Plug,
  Telescope,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Bell,
  TrendingDown,
  Mail,
  Calendar,
  Linkedin,
  ChevronRight,
} from "lucide-react";

/* ─── Types ─── */

interface Stats {
  contacts: number;
  connectors: number;
  researched: number;
  avgScore: number;
  active: number;
  weeklyNew: number;
}

interface RecentContact {
  id: string;
  full_name: string;
  avatar_url: string | null;
  company: string | null;
  title: string | null;
  relationship_score: number;
  last_interaction_at: string | null;
}

interface InsightsData {
  reconnect: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    last_interaction_at: string | null;
    relationship_score: number;
    company: string | null;
    title: string | null;
  }[];
  fading: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    relationship_score: number;
    days_since_contact: number;
    recency_drop: number;
    company: string | null;
    title: string | null;
  }[];
  recent_activity: {
    id: string;
    type: string;
    platform: string;
    subject: string | null;
    occurred_at: string;
    contact_id: string;
    contact_name: string;
    contact_avatar: string | null;
  }[];
  due_reminders: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    next_reminder_at: string;
    reminder_frequency: string;
    relationship_score: number;
    company: string | null;
    title: string | null;
  }[];
  network: {
    distribution: {
      new: number;
      acquaintance: number;
      familiar: number;
      close: number;
      inner_circle: number;
    };
    growth: { month: string; count: number }[];
    sources: { source: string; count: number }[];
  };
}

/* ─── Helpers ─── */

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function relativeDate(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function platformIcon(platform: string) {
  switch (platform) {
    case "gmail":
      return <Mail className="h-3 w-3 text-gray-400" />;
    case "calendar":
      return <Calendar className="h-3 w-3 text-gray-400" />;
    case "linkedin":
      return <Linkedin className="h-3 w-3 text-gray-400" />;
    default:
      return <Mail className="h-3 w-3 text-gray-300" />;
  }
}

/* ─── Stat Card ─── */

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`flex items-center justify-center h-7 w-7 rounded-lg ${
            accent || "bg-gray-50"
          }`}
        >
          <Icon className="h-3.5 w-3.5 text-gray-500" />
        </div>
        <ArrowUpRight className="h-3 w-3 text-gray-200 group-hover:text-gray-400 transition-colors" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900 tracking-tight tabular-nums leading-none">
          {value}
        </p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
          {label}
          {sub && (
            <span className="text-emerald-500 ml-1.5">{sub}</span>
          )}
        </p>
      </div>
    </Link>
  );
}

/* ─── Section Shell ─── */

function Section({
  title,
  icon: Icon,
  href,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-gray-300" />
          <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            {title}
          </h2>
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

/* ─── Contact Row ─── */

function ContactRow({
  contact,
  meta,
  trailing,
}: {
  contact: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    relationship_score: number;
  };
  meta: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={`/dashboard/contacts/${contact.id}`}
      className="flex items-center gap-3 group py-2 -mx-1 px-1 rounded-lg hover:bg-gray-50/60 transition-colors"
    >
      <Avatar className="h-8 w-8 shrink-0">
        {contact.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt={contact.full_name}
            referrerPolicy="no-referrer"
            className="aspect-square size-full rounded-full object-cover"
          />
        ) : (
          <AvatarFallback className="bg-gray-100 text-gray-400 text-[10px] font-medium">
            {getInitials(contact.full_name)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 truncate leading-tight">
          {contact.full_name}
        </p>
        <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
          {meta}
        </p>
      </div>
      {trailing || (
        <RelationshipScore score={contact.relationship_score} variant="compact" />
      )}
    </Link>
  );
}

/* ─── Score Ring (large) ─── */

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const color =
    score >= 81
      ? "#7C3AED"
      : score >= 61
      ? "#22C55E"
      : score >= 41
      ? "#3B82F6"
      : score >= 21
      ? "#F59E0B"
      : "#D1D5DB";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="4"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-gray-900 tabular-nums leading-none">
          {score}
        </span>
        <span className="text-[9px] text-gray-400 mt-0.5">avg</span>
      </div>
    </div>
  );
}

/* ─── Distribution Bar ─── */

function DistributionBar({
  distribution,
}: {
  distribution: InsightsData["network"]["distribution"];
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const segments = [
    { key: "inner_circle", label: "Inner Circle", color: "bg-violet-500", count: distribution.inner_circle },
    { key: "close", label: "Close", color: "bg-emerald-500", count: distribution.close },
    { key: "familiar", label: "Familiar", color: "bg-blue-400", count: distribution.familiar },
    { key: "acquaintance", label: "Acquaintance", color: "bg-amber-400", count: distribution.acquaintance },
    { key: "new", label: "New", color: "bg-gray-300", count: distribution.new },
  ];

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-[1px]">
        {segments.map(
          (s) =>
            s.count > 0 && (
              <div
                key={s.key}
                className={`${s.color} rounded-full`}
                style={{ flex: s.count }}
              />
            )
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map(
          (s) =>
            s.count > 0 && (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                <span className="text-[11px] text-gray-400">{s.label}</span>
                <span className="text-[11px] font-medium text-gray-600 tabular-nums">
                  {s.count}
                </span>
              </div>
            )
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function DashboardGrid({
  firstName,
  stats,
  recentContacts,
}: {
  firstName: string;
  stats: Stats;
  recentContacts: RecentContact[];
}) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/insights")
      .then((res) => res.json())
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4 pb-8">
      {/* Greeting */}
      {firstName && (
        <p className="text-[13px] text-gray-400 font-medium">
          {greeting}, {firstName}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatCard
          label="Connections"
          value={stats.contacts}
          icon={Users}
          href="/dashboard/contacts"
          sub={stats.weeklyNew > 0 ? `+${stats.weeklyNew} this week` : undefined}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={Activity}
          href="/dashboard/contacts"
          accent="bg-emerald-50"
        />
        <StatCard
          label="Avg Score"
          value={stats.avgScore}
          icon={TrendingUp}
          href="/dashboard/contacts"
        />
        <StatCard
          label="Connectors"
          value={stats.connectors}
          icon={Plug}
          href="/dashboard/integrations"
        />
        <StatCard
          label="Researched"
          value={stats.researched}
          icon={Telescope}
          href="/dashboard/research"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
        {/* Left Column — 3/5 */}
        <div className="lg:col-span-3 space-y-2">
          {/* Recent Contacts */}
          {recentContacts.length > 0 && (
            <Section
              title="Recent"
              icon={Activity}
              href="/dashboard/contacts"
            >
              <div className="space-y-0.5">
                {recentContacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    meta={
                      <>
                        {c.title && c.company
                          ? `${c.title} at ${c.company}`
                          : c.company || c.title || ""}
                        {c.last_interaction_at && (
                          <>
                            {(c.title || c.company) && " · "}
                            {relativeDate(c.last_interaction_at)}
                          </>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Due Reminders */}
          {insights?.due_reminders && insights.due_reminders.length > 0 && (
            <Section title="Due for Check-in" icon={Bell}>
              <div className="space-y-0.5">
                {insights.due_reminders.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    meta={
                      <>
                        {contact.reminder_frequency} &middot; due{" "}
                        {relativeDate(contact.next_reminder_at)}
                      </>
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Recent Activity */}
          {insights?.recent_activity && insights.recent_activity.length > 0 && (
            <Section title="Activity" icon={Activity}>
              <div className="space-y-0.5">
                {insights.recent_activity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/dashboard/contacts/${activity.contact_id}`}
                    className="flex items-center gap-3 group py-2 -mx-1 px-1 rounded-lg hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gray-50 shrink-0">
                      {platformIcon(activity.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-900 truncate leading-tight">
                        <span className="font-medium group-hover:text-gray-600 transition-colors">
                          {activity.contact_name}
                        </span>
                        <span className="text-gray-300 mx-1.5">&middot;</span>
                        <span className="text-gray-400">
                          {activity.type.replace(/_/g, " ")}
                        </span>
                      </p>
                      {activity.subject && (
                        <p className="text-[11px] text-gray-300 truncate leading-tight mt-0.5">
                          {activity.subject}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-300 shrink-0 tabular-nums">
                      {relativeDate(activity.occurred_at)}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right Column — 2/5 */}
        <div className="lg:col-span-2 space-y-2">
          {/* Network Health Ring */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-3.5 w-3.5 text-gray-300" />
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Network Health
              </h2>
            </div>
            <div className="flex items-center justify-center py-2">
              <ScoreRing score={stats.avgScore} />
            </div>
            <div className="text-center mt-2">
              <p className="text-[11px] text-gray-400">
                {stats.active} active of {stats.contacts} total
              </p>
            </div>
          </div>

          {/* Distribution */}
          {insights?.network && (
            <div className="rounded-2xl bg-white border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-3.5 w-3.5 text-gray-300" />
                <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Distribution
                </h2>
              </div>
              <DistributionBar distribution={insights.network.distribution} />

              {/* Sources */}
              {insights.network.sources.length > 0 && (
                <div className="border-t border-gray-50 pt-3 mt-4">
                  <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-2">
                    Sources
                  </p>
                  <div className="space-y-1.5">
                    {insights.network.sources.map(({ source, count }) => (
                      <div
                        key={source}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {platformIcon(source)}
                          <span className="text-[12px] text-gray-500 capitalize">
                            {source}
                          </span>
                        </div>
                        <span className="text-[12px] font-medium text-gray-900 tabular-nums">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reconnect */}
          {insights?.reconnect && insights.reconnect.length > 0 && (
            <Section title="Reconnect" icon={Users}>
              <div className="space-y-0.5">
                {insights.reconnect.slice(0, 4).map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    meta={
                      <>
                        {contact.last_interaction_at
                          ? relativeDate(contact.last_interaction_at)
                          : "No recent contact"}
                        {contact.company && ` · ${contact.company}`}
                      </>
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Fading */}
          {insights?.fading && insights.fading.length > 0 && (
            <Section title="Fading" icon={TrendingDown}>
              <div className="space-y-0.5">
                {insights.fading.slice(0, 3).map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    meta={
                      <>
                        {contact.days_since_contact}d since last contact
                        {contact.company && ` · ${contact.company}`}
                      </>
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-500 font-medium tabular-nums">
                          -{contact.recency_drop}
                        </span>
                        <RelationshipScore
                          score={contact.relationship_score}
                          variant="compact"
                        />
                      </div>
                    }
                  />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Loading skeleton for insights */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
          <div className="lg:col-span-3 space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse"
              />
            ))}
          </div>
          <div className="lg:col-span-2 space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
