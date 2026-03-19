"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Settings,
  Plus,
  X,
  Search,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Group, Contact } from "@/types";

/* ─── Template definitions (same as acceleration-board.tsx) ─── */
interface Seat {
  id: string;
  title: string;
  description: string;
  tags: string[];
  bg: string;
  tagBg: string;
  tagText: string;
}

interface Template {
  id: string;
  name: string;
  seats: Seat[];
}

const TEMPLATES: Template[] = [
  {
    id: "acceleration",
    name: "Acceleration Board",
    seats: [
      {
        id: "operator",
        title: "The Operator",
        description: "Runs the day-to-day. Turns vision into systems.",
        tags: ["COO", "Systems", "Execution"],
        bg: "bg-amber-50/60",
        tagBg: "bg-amber-100/80",
        tagText: "text-amber-800",
      },
      {
        id: "investor",
        title: "The Investor",
        description: "Manages money, capital allocation, and fundraising.",
        tags: ["CFO", "Capital", "Fundraising"],
        bg: "bg-emerald-50/60",
        tagBg: "bg-emerald-100/80",
        tagText: "text-emerald-800",
      },
      {
        id: "storyteller",
        title: "The Storyteller",
        description: "Tells your story. Builds brand and crafts messaging.",
        tags: ["CMO", "Brand", "Messaging"],
        bg: "bg-violet-50/60",
        tagBg: "bg-violet-100/80",
        tagText: "text-violet-800",
      },
      {
        id: "protector",
        title: "The Protector",
        description: "Reads fine print, structures deals, protects wealth.",
        tags: ["Lawyer", "Compliance", "Deals"],
        bg: "bg-slate-50/80",
        tagBg: "bg-slate-100/80",
        tagText: "text-slate-700",
      },
      {
        id: "optimist",
        title: "The Optimist",
        description: "Believes in you. Keeps you going through dark days.",
        tags: ["Partner", "Support", "Mindset"],
        bg: "bg-rose-50/60",
        tagBg: "bg-rose-100/80",
        tagText: "text-rose-800",
      },
    ],
  },
  {
    id: "directors",
    name: "Board of Directors",
    seats: [
      {
        id: "sales",
        title: "Sales & Revenue",
        description: "Helps close deals and build repeatable revenue.",
        tags: ["Closing", "Pipeline", "Revenue"],
        bg: "bg-emerald-50/60",
        tagBg: "bg-emerald-100/80",
        tagText: "text-emerald-800",
      },
      {
        id: "growth",
        title: "Growth & Audience",
        description: "Builds distribution — social, newsletters, YouTube.",
        tags: ["Distribution", "Audience", "Social"],
        bg: "bg-blue-50/60",
        tagBg: "bg-blue-100/80",
        tagText: "text-blue-800",
      },
      {
        id: "community",
        title: "Community & Brand",
        description: "Builds raving fans and turns customers into evangelists.",
        tags: ["Retention", "Engagement", "Tribe"],
        bg: "bg-violet-50/60",
        tagBg: "bg-violet-100/80",
        tagText: "text-violet-800",
      },
      {
        id: "product",
        title: "Product & Engineering",
        description: "Builds the right thing — product, UX, architecture.",
        tags: ["Product", "UX", "Engineering"],
        bg: "bg-cyan-50/60",
        tagBg: "bg-cyan-100/80",
        tagText: "text-cyan-800",
      },
      {
        id: "finance",
        title: "Finance & Strategy",
        description: "Capital allocation, fundraising, long-term strategy.",
        tags: ["Finance", "Strategy", "Capital"],
        bg: "bg-amber-50/60",
        tagBg: "bg-amber-100/80",
        tagText: "text-amber-800",
      },
      {
        id: "content",
        title: "Content & Storytelling",
        description: "Crafts narratives — positioning and messaging.",
        tags: ["Writing", "Narratives", "Voice"],
        bg: "bg-rose-50/60",
        tagBg: "bg-rose-100/80",
        tagText: "text-rose-800",
      },
      {
        id: "marketing",
        title: "Marketing & Positioning",
        description: "Demand generation, brand positioning, creating desire.",
        tags: ["Demand Gen", "Positioning", "Brand"],
        bg: "bg-orange-50/60",
        tagBg: "bg-orange-100/80",
        tagText: "text-orange-800",
      },
      {
        id: "legal",
        title: "Legal & Operations",
        description: "Keeps you safe and business running smoothly.",
        tags: ["Legal", "Ops", "Contracts"],
        bg: "bg-slate-50/80",
        tagBg: "bg-slate-100/80",
        tagText: "text-slate-700",
      },
    ],
  },
];

/* ─── Helpers ─── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Assignment type from acceleration_board ─── */
interface Assignment {
  role: string;
  contact_id: string;
  display_name?: string;
  description?: string;
  contact?: Contact;
}

/* ─── Main Page ─── */
export default function CircleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect if this circle matches a template
  const template = group
    ? TEMPLATES.find((t) => t.name === group.name)
    : null;

  const fetchData = useCallback(async () => {
    try {
      const [groupRes, boardRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch("/api/acceleration-board"),
      ]);

      if (!groupRes.ok) {
        router.push("/dashboard/groups");
        return;
      }

      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setEditName(groupData.group.name);
      setEditDesc(groupData.group.description || "");

      if (boardRes.ok) {
        const boardData = await boardRes.json();
        setAssignments(boardData.assignments || []);
      }
    } catch {
      router.push("/dashboard/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeRole && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeRole]);

  async function searchContacts(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/contacts/search?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.contacts || []).slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  function handleSearchInput(q: string) {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchContacts(q), 250);
  }

  async function assignContact(role: string, contactId: string, seat: Seat) {
    setSaving(role);
    try {
      const res = await fetch("/api/acceleration-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          contact_id: contactId,
          display_name: seat.title,
          description: seat.description,
          category: "expert",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments((prev) => [
          ...prev.filter((a) => a.role !== role),
          data.assignment,
        ]);
      }
    } catch {
      // ignore
    } finally {
      setSaving(null);
      setActiveRole(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }

  async function removeAssignment(role: string) {
    setSaving(role);
    try {
      await fetch("/api/acceleration-board", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setAssignments((prev) => prev.filter((a) => a.role !== role));
    } catch {
      // ignore
    } finally {
      setSaving(null);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      setGroup((prev) =>
        prev ? { ...prev, name: editName, description: editDesc } : prev
      );
      setShowSettings(false);
    } catch {
      // ignore
    } finally {
      setSavingSettings(false);
    }
  }

  async function deleteGroup() {
    setDeleting(true);
    try {
      await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      router.push("/dashboard/groups");
    } catch {
      setDeleting(false);
    }
  }

  function getAssignment(roleId: string): Assignment | undefined {
    return assignments.find((a) => a.role === roleId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!group) return null;

  const seats = template?.seats || [];
  const filledCount = seats.filter((s) => getAssignment(s.id)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard/groups")}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </button>
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-2xl text-gray-900 truncate">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {group.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {template && (
            <span className="text-[11px] text-gray-400 tabular-nums">
              {filledCount}/{seats.length} filled
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Circle name"
            className="w-full h-9 px-3 rounded-lg border border-gray-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all resize-none"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={deleteGroup}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Delete Circle
            </button>
            <button
              onClick={saveSettings}
              disabled={savingSettings || !editName.trim()}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
            >
              {savingSettings ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Template roles */}
      {template ? (
        <div className="space-y-2">
          {seats.map((seat) => {
            const assignment = getAssignment(seat.id);
            const contact = assignment?.contact;
            const isActive = activeRole === seat.id;
            const isSaving = saving === seat.id;

            return (
              <div
                key={seat.id}
                className={`rounded-xl border overflow-hidden transition-all ${seat.bg} ${
                  isActive
                    ? "border-gray-900/15 ring-1 ring-gray-900/5"
                    : "border-gray-200/50 hover:border-gray-300/60"
                }`}
              >
                {/* Role header */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[13px] font-semibold text-gray-900">
                        {seat.title}
                      </h3>
                      <div className="flex gap-1">
                        {seat.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${seat.tagBg} ${seat.tagText}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {seat.description}
                    </p>
                  </div>

                  {/* Right — assigned contact or assign button */}
                  <div className="shrink-0">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : contact ? (
                      <div className="flex items-center gap-2 pl-2 pr-1 py-0.5 rounded-full bg-white/80 border border-gray-200/60">
                        <Avatar className="h-6 w-6 shrink-0">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url}
                              alt={contact.full_name}
                              referrerPolicy="no-referrer"
                              className="aspect-square size-full rounded-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-[8px] font-medium">
                              {getInitials(contact.full_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <span className="text-[11px] font-medium text-gray-700 block truncate max-w-[100px]">
                            {contact.full_name}
                          </span>
                          {(contact.title || contact.company) && (
                            <span className="text-[9px] text-gray-400 block truncate max-w-[100px]">
                              {[contact.title, contact.company]
                                .filter(Boolean)
                                .join(" at ")}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeAssignment(seat.id)}
                          className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <X className="h-3 w-3 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveRole(isActive ? null : seat.id);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300/80 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors bg-white/50"
                      >
                        <Plus className="h-3 w-3" />
                        Assign
                      </button>
                    )}
                  </div>
                </div>

                {/* Search dropdown */}
                {isActive && !contact && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200/80 bg-white/80 text-[12px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/8 focus:border-gray-300 transition-all"
                      />
                    </div>
                    {searching && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200/60 bg-white/90 overflow-hidden">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() =>
                              assignContact(seat.id, c.id, seat)
                            }
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white transition-colors text-left"
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              {c.avatar_url ? (
                                <img
                                  src={c.avatar_url}
                                  alt={c.full_name}
                                  referrerPolicy="no-referrer"
                                  className="aspect-square size-full rounded-full object-cover"
                                />
                              ) : (
                                <AvatarFallback className="bg-gray-100 text-gray-500 text-[8px] font-medium">
                                  {getInitials(c.full_name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-gray-900 truncate">
                                {c.full_name}
                              </p>
                              {(c.title || c.company) && (
                                <p className="text-[10px] text-gray-400 truncate">
                                  {[c.title, c.company]
                                    .filter(Boolean)
                                    .join(" at ")}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery && !searching && searchResults.length === 0 && (
                      <p className="text-[11px] text-gray-400 text-center py-2">
                        No contacts found
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Non-template circle — simple empty state */
        <div className="p-8 rounded-xl border border-gray-900/10 bg-white text-center">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Check className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            This circle is set up. Invite friends or configure bots from
            settings.
          </p>
        </div>
      )}
    </div>
  );
}
