"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Link2,
  Mail,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RelationshipScore } from "@/components/relationship-score";
import { DonutChart } from "@/components/donut-chart";
import type { Contact } from "@/types";

const SOURCE_META: Record<string, { color: string; label: string }> = {
  gmail: { color: "#FF3B30", label: "Gmail" },
  calendar: { color: "#007AFF", label: "Calendar" },
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  manual: { color: "#8E8E93", label: "Manual" },
};

const SOURCE_BADGE: Record<string, string> = {
  gmail: "bg-red-50 text-red-600",
  calendar: "bg-blue-50 text-blue-600",
  linkedin: "bg-sky-50 text-sky-600",
  manual: "bg-gray-100 text-gray-500",
};

const TAG_COLORS: Record<string, string> = {
  investor: "bg-amber-50 text-amber-700",
  founder: "bg-purple-50 text-purple-700",
  engineer: "bg-blue-50 text-blue-700",
  designer: "bg-pink-50 text-pink-700",
  recruiter: "bg-green-50 text-green-700",
  advisor: "bg-orange-50 text-orange-700",
};

type SortField = "full_name" | "company" | "location" | "source" | "relationship_score" | "last_interaction_at" | "created_at" | "interaction_count" | "tags";
type SortDir = "asc" | "desc";

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  contacts: Contact[];
  stats: {
    connections: number;
    accounts: number;
    emails: number;
  };
}

export function ConnectionsDashboard({ contacts, stats }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefreshScores() {
    setRefreshing(true);
    try {
      await fetch("/api/contacts/relationship-scores", { method: "POST" });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }

  const sourceSegments = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      counts[c.source] = (counts[c.source] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([source, count]) => ({
        label: SOURCE_META[source]?.label || source,
        value: count,
        color: SOURCE_META[source]?.color || "#8E8E93",
      }))
      .sort((a, b) => b.value - a.value);
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      if (sortField === "relationship_score" || sortField === "interaction_count") {
        const aVal = (a[sortField] as number) || 0;
        const bVal = (b[sortField] as number) || 0;
        const cmp = aVal - bVal;
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortField === "last_interaction_at" || sortField === "created_at") {
        const aVal = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
        const bVal = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
        const cmp = aVal - bVal;
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortField === "tags") {
        const aVal = (a.tags || []).length;
        const bVal = (b.tags || []).length;
        const cmp = aVal - bVal;
        return sortDir === "asc" ? cmp : -cmp;
      }
      const aVal = ((a[sortField] as string) || "").toLowerCase();
      const bVal = ((b[sortField] as string) || "").toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [contacts, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-gray-900" />
    ) : (
      <ChevronDown className="h-3 w-3 text-gray-900" />
    );
  };

  const statItems = [
    {
      label: "Connections",
      value: stats.connections,
      icon: Users,
    },
    {
      label: "Accounts",
      value: stats.accounts,
      icon: Link2,
    },
    {
      label: "Interactions",
      value: stats.emails,
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {statItems.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-200/80"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50">
              <stat.icon className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 tracking-tight tabular-nums leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      {sourceSegments.length > 0 && (
        <div className="p-5 rounded-xl bg-white border border-gray-200/80">
          <h2 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-4">
            Sources
          </h2>
          <DonutChart segments={sourceSegments} />
        </div>
      )}

      {/* Search + Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connections..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/8 focus:border-gray-300 transition-all"
          />
        </div>
        <button
          onClick={handleRefreshScores}
          disabled={refreshing}
          className="h-10 px-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Scores"}
        </button>
      </div>

      {/* Contacts Sheet View */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search
              ? "No contacts match your search."
              : "No contacts yet. Connect your accounts to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-200/80 overflow-x-auto">
          <table className="table-fixed w-full min-w-[1200px]">
            <colgroup>
              <col style={{ width: 240 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 130 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 sticky left-0 bg-gray-50/50 z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200">
                  <button
                    onClick={() => toggleSort("full_name")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Name <SortIcon field="full_name" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("company")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Company <SortIcon field="company" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Tags
                  </span>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("last_interaction_at")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Last Contacted <SortIcon field="last_interaction_at" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    First Contact <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("source")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Source <SortIcon field="source" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("interaction_count")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Interactions <SortIcon field="interaction_count" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("relationship_score")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Score <SortIcon field="relationship_score" />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5">
                  <button
                    onClick={() => toggleSort("location")}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Location <SortIcon field="location" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {filtered.map((contact) => {
                const initials = contact.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={contact.id}
                    onClick={() =>
                      router.push(`/dashboard/contacts/${contact.id}`)
                    }
                    className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    {/* Name (sticky) */}
                    <td className="px-4 py-2.5 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200/80">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url}
                              alt={contact.full_name}
                              referrerPolicy="no-referrer"
                              className="aspect-square size-full rounded-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gray-100 text-gray-500 text-[9px] font-medium">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 truncate max-w-[180px]">
                            {contact.full_name}
                          </p>
                          {contact.title && (
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">
                              {contact.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-gray-600 truncate block max-w-[140px]">
                        {contact.company || "\u2014"}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                        {contact.tags && contact.tags.length > 0 ? (
                          <>
                            {contact.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                                  TAG_COLORS[tag.toLowerCase()] || "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="text-[10px] text-gray-400">
                                +{contact.tags.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-300">{"\u2014"}</span>
                        )}
                      </div>
                    </td>

                    {/* Last Contacted */}
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-gray-500 whitespace-nowrap">
                        {formatRelativeDate(contact.last_interaction_at)}
                      </span>
                    </td>

                    {/* First Contact */}
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-gray-500 whitespace-nowrap">
                        {formatDate(contact.created_at)}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${
                          SOURCE_BADGE[contact.source] ||
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {SOURCE_META[contact.source]?.label || contact.source}
                      </span>
                    </td>

                    {/* Interactions */}
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-gray-500 tabular-nums">
                        {contact.interaction_count || 0}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-2.5">
                      {contact.relationship_score != null ? (
                        <RelationshipScore
                          score={contact.relationship_score}
                          variant="compact"
                        />
                      ) : (
                        <span className="text-[11px] text-gray-300">{"\u2014"}</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-gray-500 truncate block max-w-[140px]">
                        {contact.location || "\u2014"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
