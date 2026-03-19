"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Search,
  Loader2,
  Check,
  ChevronDown,
  Copy,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Contact } from "@/types";

/* ─── Seat definition ─── */
interface Seat {
  id: string;
  title: string;
  description: string;
  tags: string[];
  bg: string;
  tagBg: string;
  tagText: string;
}

/* ─── Circle framework definition ─── */
interface CircleFramework {
  id: string;
  name: string;
  description: string;
  creator: { name: string; photo: string; initials: string };
  seats: Seat[];
  cardBg: string;
  accentColor: string;
}

/* ─── Frameworks ─── */
const FRAMEWORKS: CircleFramework[] = [
  {
    id: "acceleration",
    name: "Acceleration Board",
    description:
      "The 5 roles that make people rich — your operator, investor, storyteller, protector, and optimist.",
    creator: {
      name: "Codie Sanchez",
      photo: "https://unavatar.io/x/Coabornsanchez",
      initials: "CS",
    },
    cardBg: "bg-sky-50/50",
    accentColor: "bg-sky-100/70",
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
    description:
      "Your personal board of advisors — map growth areas and assign the best people for each seat.",
    creator: {
      name: "Matt Gray",
      photo: "https://unavatar.io/x/matt_gray_",
      initials: "MG",
    },
    cardBg: "bg-orange-50/40",
    accentColor: "bg-orange-100/60",
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

/* ─── Types ─── */
interface Assignment {
  role: string;
  contact_id: string;
  display_name?: string;
  description?: string;
  category?: string;
  contact?: Contact;
}

/* ─── Helpers ─── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Creator Pill ─── */
function CreatorPill({
  name,
  photo,
  initials,
}: {
  name: string;
  photo: string;
  initials: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="inline-flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-white/80 border border-gray-200/60">
      {imgErr ? (
        <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold text-white">
          {initials}
        </div>
      ) : (
        <img
          src={photo}
          alt={name}
          className="h-5 w-5 rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgErr(true)}
        />
      )}
      <span className="text-[11px] font-medium text-gray-600">{name}</span>
    </div>
  );
}

/* ─── Role Row (inside expanded card) ─── */
function RoleRow({
  seat,
  assignment,
  isActive,
  isSaving,
  onToggle,
  onAssign,
  onRemove,
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  onSearch,
  searchInputRef,
}: {
  seat: Seat;
  assignment?: Assignment;
  isActive: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onAssign: (contactId: string) => void;
  onRemove: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Contact[];
  searching: boolean;
  onSearch: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const contact = assignment?.contact;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${seat.bg} ${
        isActive
          ? "border-gray-900/15 ring-1 ring-gray-900/5"
          : "border-gray-200/50 hover:border-gray-300/60"
      }`}
    >
      {/* Role header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-semibold text-gray-900">
              {seat.title}
            </h4>
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
        </div>

        {/* Right side — assigned contact or assign button */}
        <div className="shrink-0">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : contact ? (
            <div className="flex items-center gap-2 pl-2 pr-1 py-0.5 rounded-full bg-white/80 border border-gray-200/60">
              <Avatar className="h-5 w-5 shrink-0">
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt={contact.full_name}
                    referrerPolicy="no-referrer"
                    className="aspect-square size-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-[7px] font-medium">
                    {getInitials(contact.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-[11px] font-medium text-gray-700 max-w-[80px] truncate">
                {contact.full_name}
              </span>
              <button
                onClick={onRemove}
                className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300/80 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors bg-white/50"
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
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
                  onClick={() => onAssign(c.id)}
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
                        {[c.title, c.company].filter(Boolean).join(" at ")}
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
}

/* ─── Main Component ─── */
export function AccelerationBoard({
  onCircleCreated,
}: {
  onCircleCreated?: (circle: { id: string; name: string; description: string | null; member_count: number }) => void;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFramework, setOpenFramework] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddSeat, setShowAddSeat] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null);
  const [addedTemplates, setAddedTemplates] = useState<Set<string>>(new Set());
  const [errorTemplate, setErrorTemplate] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBoard();
  }, []);

  useEffect(() => {
    if (activeRole && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeRole]);

  useEffect(() => {
    if (showAddSeat && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showAddSeat]);

  async function fetchBoard() {
    try {
      const res = await fetch("/api/acceleration-board");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

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

  async function assignContact(
    role: string,
    contactId: string,
    displayName?: string,
    description?: string
  ) {
    setSaving(role);
    try {
      const res = await fetch("/api/acceleration-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          contact_id: contactId,
          display_name: displayName,
          description,
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

  async function handleAddToSynapse(fw: CircleFramework) {
    if (addingTemplate || addedTemplates.has(fw.id)) return;
    setAddingTemplate(fw.id);
    setErrorTemplate(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fw.name,
          description: fw.description,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to add circle:", res.status, err);
        setErrorTemplate(fw.id);
        setTimeout(() => setErrorTemplate(null), 3000);
        return;
      }
      const data = await res.json();
      setAddedTemplates((prev) => new Set(prev).add(fw.id));
      onCircleCreated?.(data.group);
    } catch (err) {
      console.error("Add to Synapse error:", err);
      setErrorTemplate(fw.id);
      setTimeout(() => setErrorTemplate(null), 3000);
    } finally {
      setAddingTemplate(null);
    }
  }

  function getAssignment(roleId: string): Assignment | undefined {
    return assignments.find((a) => a.role === roleId);
  }

  // Custom seats from DB that aren't in any framework
  const allSeatIds = FRAMEWORKS.flatMap((f) => f.seats.map((s) => s.id));
  const customSeats: Seat[] = assignments
    .filter((a) => !allSeatIds.includes(a.role))
    .filter((a) => a.contact_id)
    .map((a) => ({
      id: a.role,
      title: a.display_name || a.role,
      description: a.description || "Custom advisor seat.",
      tags: ["Custom"],
      bg: "bg-gray-50/60",
      tagBg: "bg-gray-100/80",
      tagText: "text-gray-700",
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-1">
        Community Templates
      </h2>
      <div className="grid grid-cols-2 gap-4 items-stretch">
        {FRAMEWORKS.map((fw) => {
          const isOpen = openFramework === fw.id;
          const filledCount = fw.seats.filter(
            (s) => getAssignment(s.id)
          ).length;
          const allSeats =
            fw.id === "directors"
              ? [...fw.seats, ...customSeats]
              : fw.seats;
          const totalSeats = allSeats.length;
          const isAdding = addingTemplate === fw.id;
          const isAdded = addedTemplates.has(fw.id);
          const hasError = errorTemplate === fw.id;

          return (
            <div
              key={fw.id}
              className={`rounded-2xl border overflow-hidden transition-all flex flex-col ${
                isOpen
                  ? "col-span-2 border-gray-300/80"
                  : `${fw.cardBg} border-gray-200/60 hover:border-gray-300/80`
              }`}
            >
              {/* Card face — flex-1 pushes footer to bottom for equal height */}
              <div className={`flex flex-col flex-1 p-6 ${isOpen ? fw.cardBg : ""}`}>
                <div className="space-y-3 flex-1">
                  <h3 className="text-[17px] font-bold text-gray-900">
                    {fw.name}
                  </h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    {fw.description}
                  </p>

                  {/* Tags preview — show full seat titles */}
                  <div className="flex flex-wrap gap-1.5">
                    {fw.seats.map((s) => {
                      const assigned = !!getAssignment(s.id);
                      return (
                        <span
                          key={s.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            assigned
                              ? "bg-gray-900/5 text-gray-700"
                              : `${s.tagBg} ${s.tagText}`
                          }`}
                        >
                          {assigned && (
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                          )}
                          {s.title}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Footer — mt-auto pins it to bottom so both cards align */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-200/40">
                  <div className="flex items-center gap-2.5">
                    <CreatorPill
                      name={fw.creator.name}
                      photo={fw.creator.photo}
                      initials={fw.creator.initials}
                    />
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      {filledCount}/{totalSeats}
                    </span>
                  </div>
                  {isOpen ? (
                    <button
                      onClick={() => {
                        setOpenFramework(null);
                        setActiveRole(null);
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowAddSeat(false);
                      }}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Close
                      <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToSynapse(fw)}
                      disabled={isAdding || isAdded}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium disabled:cursor-not-allowed transition-colors ${
                        hasError
                          ? "bg-red-100 text-red-700"
                          : isAdded
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] disabled:opacity-60"
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : hasError ? (
                        "Failed — try again"
                      ) : isAdded ? (
                        <>
                          <Check className="h-3 w-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Add to Synapse
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded roles */}
              {isOpen && (
                <div className="px-6 pb-6 space-y-2">
                  {allSeats.map((seat) => (
                    <RoleRow
                      key={seat.id}
                      seat={seat}
                      assignment={getAssignment(seat.id)}
                      isActive={activeRole === seat.id}
                      isSaving={saving === seat.id}
                      onToggle={() => {
                        setActiveRole(
                          activeRole === seat.id ? null : seat.id
                        );
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      onAssign={(contactId) =>
                        assignContact(
                          seat.id,
                          contactId,
                          seat.title,
                          seat.description
                        )
                      }
                      onRemove={() => removeAssignment(seat.id)}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      searchResults={searchResults}
                      searching={searching}
                      onSearch={searchContacts}
                      searchInputRef={searchInputRef}
                    />
                  ))}

                  {/* Add custom seat (only for Board of Directors) */}
                  {fw.id === "directors" && (
                    <>
                      {!showAddSeat ? (
                        <button
                          onClick={() => setShowAddSeat(true)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300/80 text-[12px] font-medium text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add custom seat
                        </button>
                      ) : (
                        <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-medium text-gray-900">
                              New seat
                            </h3>
                            <button
                              onClick={() => {
                                setShowAddSeat(false);
                                setCustomTitle("");
                                setCustomDesc("");
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                          </div>
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Seat title (e.g. HR & Culture)"
                            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/8 focus:border-gray-300 transition-all"
                          />
                          <textarea
                            value={customDesc}
                            onChange={(e) => setCustomDesc(e.target.value)}
                            placeholder="Why this seat matters (optional)"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/8 focus:border-gray-300 transition-all resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                if (!customTitle.trim()) return;
                                const seatId = customTitle
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/^-|-$/g, "");
                                setShowAddSeat(false);
                                const tempAssignment: Assignment = {
                                  role: seatId,
                                  contact_id: "",
                                  display_name: customTitle.trim(),
                                  description: customDesc.trim(),
                                  category: "expert",
                                };
                                setAssignments((prev) => [
                                  ...prev,
                                  tempAssignment,
                                ]);
                                setCustomTitle("");
                                setCustomDesc("");
                                setTimeout(() => {
                                  setActiveRole(seatId);
                                  setSearchQuery("");
                                  setSearchResults([]);
                                }, 100);
                              }}
                              disabled={!customTitle.trim()}
                              className="px-3.5 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-[12px] font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Add Seat
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
