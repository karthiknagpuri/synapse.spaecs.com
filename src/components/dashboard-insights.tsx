"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RelationshipScore } from "@/components/relationship-score";
import {
  Mail,
  Calendar,
  Linkedin,
  TrendingDown,
  Clock,
  Users,
  Bell,
  Activity,
} from "lucide-react";
import Link from "next/link";

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

const SOURCE_META: Record<string, { color: string; label: string }> = {
  gmail: { color: "bg-red-400", label: "Gmail" },
  calendar: { color: "bg-blue-400", label: "Calendar" },
  linkedin: { color: "bg-sky-500", label: "LinkedIn" },
  manual: { color: "bg-gray-300", label: "Manual" },
};

function platformIcon(platform: string) {
  switch (platform) {
    case "gmail":
      return <Mail className="h-3.5 w-3.5 text-red-400" />;
    case "calendar":
      return <Calendar className="h-3.5 w-3.5 text-blue-400" />;
    case "linkedin":
      return <Linkedin className="h-3.5 w-3.5 text-sky-500" />;
    default:
      return <Mail className="h-3.5 w-3.5 text-gray-300" />;
  }
}

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

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-3.5 w-3.5 text-gray-300" />
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-widest">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

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
      className="flex items-center gap-3 group py-1"
    >
      <Avatar className="h-8 w-8">
        {contact.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt={contact.full_name}
            referrerPolicy="no-referrer"
            className="aspect-square size-full rounded-full object-cover"
          />
        ) : (
          <AvatarFallback className="bg-gray-50 text-gray-400 text-[10px] font-medium">
            {getInitials(contact.full_name)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600 transition-colors">
          {contact.full_name}
        </p>
        <p className="text-xs text-gray-300 truncate">{meta}</p>
      </div>
      {trailing || (
        <RelationshipScore score={contact.relationship_score} variant="compact" />
      )}
    </Link>
  );
}

export function DashboardInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/insights")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const hasReminders = data.due_reminders.length > 0;
  const hasReconnect = data.reconnect.length > 0;
  const hasFading = data.fading.length > 0;
  const hasActivity = data.recent_activity.length > 0;
  const totalContacts = Object.values(data.network.distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {/* Due Reminders */}
      {hasReminders && (
        <SectionCard icon={Bell} title="Due for Check-in">
          <div className="space-y-2">
            {data.due_reminders.map((contact) => (
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
        </SectionCard>
      )}

      {/* Reconnect Suggestions */}
      {hasReconnect && (
        <SectionCard icon={Users} title="Reconnect">
          <div className="space-y-2">
            {data.reconnect.map((contact) => (
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
        </SectionCard>
      )}

      {/* Fading Relationships */}
      {hasFading && (
        <SectionCard icon={TrendingDown} title="Fading">
          <div className="space-y-2">
            {data.fading.map((contact) => (
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
                    <span className="text-[10px] text-amber-400 font-medium tabular-nums">
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
        </SectionCard>
      )}

      {/* Recent Activity */}
      {hasActivity && (
        <SectionCard icon={Activity} title="Recent Activity">
          <div className="space-y-2">
            {data.recent_activity.map((activity) => (
              <Link
                key={activity.id}
                href={`/dashboard/contacts/${activity.contact_id}`}
                className="flex items-center gap-3 group py-1"
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gray-50/80">
                  {platformIcon(activity.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    <span className="font-medium group-hover:text-gray-600 transition-colors">
                      {activity.contact_name}
                    </span>
                    <span className="text-gray-200 mx-1.5">&middot;</span>
                    <span className="text-gray-300">
                      {activity.type.replace(/_/g, " ")}
                    </span>
                  </p>
                  {activity.subject && (
                    <p className="text-xs text-gray-300 truncate">
                      {activity.subject}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-gray-200 shrink-0 tabular-nums">
                  {relativeDate(activity.occurred_at)}
                </span>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Network Overview */}
      {totalContacts > 0 && (
        <SectionCard icon={Clock} title="Network Health">
          {/* Score Distribution */}
          <div className="space-y-2.5 mb-5">
            {[
              { key: "inner_circle", label: "Inner Circle", color: "bg-violet-400", count: data.network.distribution.inner_circle },
              { key: "close", label: "Close", color: "bg-emerald-400", count: data.network.distribution.close },
              { key: "familiar", label: "Familiar", color: "bg-blue-400", count: data.network.distribution.familiar },
              { key: "acquaintance", label: "Acquaintance", color: "bg-amber-300", count: data.network.distribution.acquaintance },
              { key: "new", label: "New", color: "bg-gray-200", count: data.network.distribution.new },
            ].map(({ key, label, color, count }) => {
              const pct = totalContacts > 0 ? (count / totalContacts) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 w-20 shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 h-1 bg-gray-100/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-300 tabular-nums w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Network Growth */}
          {data.network.growth.length > 0 && (
            <div className="border-t border-gray-100/60 pt-4 mt-4">
              <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3">
                Growth
              </p>
              <div className="space-y-1.5">
                {data.network.growth.map(({ month, count }) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">{formatMonth(month)}</span>
                    <span className="text-xs font-medium text-gray-900 tabular-nums">
                      +{count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Breakdown */}
          {data.network.sources.length > 0 && (
            <div className="border-t border-gray-100/60 pt-4 mt-4">
              <p className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3">
                Sources
              </p>
              <div className="flex items-center gap-4">
                {data.network.sources.map(({ source, count }) => (
                  <div key={source} className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${SOURCE_META[source]?.color || "bg-gray-300"}`}
                    />
                    <span className="text-xs text-gray-300">
                      {SOURCE_META[source]?.label || source}
                    </span>
                    <span className="text-xs font-medium text-gray-900 tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
