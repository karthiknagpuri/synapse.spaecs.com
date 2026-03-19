"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RoleData {
  id: string;
  label: string;
  count: number;
  avatars: string[];
  names: string[];
}

/* ─── Flat accent per role — no gradients ─── */
const ROLE_STYLES: Record<string, { bg: string; iconBg: string; iconText: string }> = {
  investors:  { bg: "bg-emerald-50/50", iconBg: "bg-emerald-100/80", iconText: "text-emerald-700" },
  founders:   { bg: "bg-amber-50/50",   iconBg: "bg-amber-100/80",   iconText: "text-amber-700" },
  engineers:  { bg: "bg-sky-50/50",     iconBg: "bg-sky-100/80",     iconText: "text-sky-700" },
  designers:  { bg: "bg-violet-50/50",  iconBg: "bg-violet-100/80",  iconText: "text-violet-700" },
  marketers:  { bg: "bg-rose-50/50",    iconBg: "bg-rose-100/80",    iconText: "text-rose-700" },
  sales:      { bg: "bg-orange-50/50",  iconBg: "bg-orange-100/80",  iconText: "text-orange-700" },
  product:    { bg: "bg-cyan-50/50",    iconBg: "bg-cyan-100/80",    iconText: "text-cyan-700" },
  creators:   { bg: "bg-pink-50/50",    iconBg: "bg-pink-100/80",    iconText: "text-pink-700" },
  advisors:   { bg: "bg-slate-50/60",   iconBg: "bg-slate-100/80",   iconText: "text-slate-600" },
  operators:  { bg: "bg-indigo-50/50",  iconBg: "bg-indigo-100/80",  iconText: "text-indigo-700" },
};

const DEFAULT_STYLE = { bg: "bg-gray-50/50", iconBg: "bg-gray-100/80", iconText: "text-gray-600" };

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

/*
 * TRUE FIBONACCI BENTO
 *
 * Row heights use Fibonacci numbers: 144px, 89px, 55px
 *   → 144 / 89 = 1.617 ≈ φ
 *   → 89 / 55  = 1.618 ≈ φ
 *
 * Column spans use Fibonacci numbers on an 8-col grid: 5, 3, 2
 *   → 5 / 3 = 1.667 ≈ φ
 *   → 3 / 2 = 1.5   ≈ φ
 *
 * Tile areas (cols × row height):
 *   #1  5 × 144 = 720   ─┐ 720/432 = 1.67 ≈ φ
 *   #2  3 × 144 = 432   ─┤ 432/267 = 1.62 ≈ φ
 *   #3  3 × 89  = 267   ─┤ 267/178 = 1.50 ≈ φ
 *   #4  2 × 89  = 178   ─┤ 178/110 = 1.62 ≈ φ
 *   #5  3 × 89  = 267   ─┤
 *   #6  2 × 55  = 110   ─┤ 110/165 (same tier)
 *   #7  3 × 55  = 165   ─┤
 *   #8  3 × 55  = 165   ─┘
 *
 *  ┌──────────────────────────┬────────────────┐  ─┐
 *  │                          │                │   │ 144px
 *  │    #1 HERO (5 cols)      │  #2 (3 cols)   │   │
 *  │                          │                │   │
 *  ├─────────┬───────┬────────┴────────────────┤  ─┤
 *  │ #3      │ #4    │         #5              │   │ 89px
 *  │ (3 col) │(2 col)│        (3 col)          │   │
 *  ├──────┬──┴───────┼────────────────────────┤  ─┤
 *  │ #6   │  #7      │         #8              │   │ 55px
 *  │(2col)│ (3 col)  │        (3 col)          │   │
 *  └──────┴──────────┴────────────────────────┘  ─┘
 */

interface GridSlot {
  col: string;
  row: string;
  variant: "hero" | "large" | "medium" | "compact" | "tiny";
}

const GRID_SLOTS: GridSlot[] = [
  { col: "1 / 6",  row: "1 / 2", variant: "hero" },     // 5 cols × 144px
  { col: "6 / 9",  row: "1 / 2", variant: "large" },     // 3 cols × 144px
  { col: "1 / 4",  row: "2 / 3", variant: "medium" },    // 3 cols × 89px
  { col: "4 / 6",  row: "2 / 3", variant: "compact" },   // 2 cols × 89px
  { col: "6 / 9",  row: "2 / 3", variant: "medium" },    // 3 cols × 89px
  { col: "1 / 3",  row: "3 / 4", variant: "tiny" },      // 2 cols × 55px
  { col: "3 / 6",  row: "3 / 4", variant: "tiny" },      // 3 cols × 55px
  { col: "6 / 9",  row: "3 / 4", variant: "tiny" },      // 3 cols × 55px
];

/* Fibonacci row heights */
const GRID_ROWS = "144px 89px 55px";

export function PeopleBento() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contacts/featured");
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: GRID_ROWS,
          }}
        >
          {GRID_SLOTS.slice(0, 5).map((slot, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white animate-pulse"
              style={{
                gridColumn: slot.col,
                gridRow: slot.row,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (roles.length === 0) return null;

  function handleClick(label: string) {
    router.push(`/dashboard/search?q=${encodeURIComponent(label)}&scope=connections`);
  }

  const visibleRoles = roles.slice(0, GRID_SLOTS.length);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-gray-300 font-medium px-0.5">
        Your Network
      </p>
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: GRID_ROWS,
        }}
      >
        {visibleRoles.map((role, i) => {
          const slot = GRID_SLOTS[i];
          const accent = ROLE_STYLES[role.id] || DEFAULT_STYLE;

          return (
            <RoleCard
              key={role.id}
              role={role}
              slot={slot}
              accent={accent}
              onClick={() => handleClick(role.label)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Unified card — adapts content to Fibonacci tier ─── */
function RoleCard({
  role,
  slot,
  accent,
  onClick,
}: {
  role: RoleData;
  slot: GridSlot;
  accent: { bg: string; iconBg: string; iconText: string };
  onClick: () => void;
}) {
  const { variant } = slot;
  const useBg = variant === "hero" || variant === "large";

  return (
    <button
      onClick={onClick}
      className={`group ${useBg ? accent.bg : "bg-white"} rounded-2xl text-left overflow-hidden transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)]`}
      style={{
        gridColumn: slot.col,
        gridRow: slot.row,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── HERO — 5 × 144 = 720 area units ── */}
      {variant === "hero" && (
        <div className="h-full flex flex-col justify-between p-5">
          <div>
            <p className="text-[22px] font-semibold text-gray-900 leading-tight">
              {role.label}
            </p>
            <p className="text-[12px] text-gray-400 mt-1.5">
              {role.count} {role.count === 1 ? "person" : "people"} in your network
            </p>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex -space-x-2">
              {role.avatars.slice(0, 4).map((url, j) => (
                <Avatar key={j} className="h-8 w-8 ring-2 ring-white/80">
                  {url ? (
                    <img src={url} alt="" referrerPolicy="no-referrer" className="aspect-square size-full rounded-full object-cover" />
                  ) : (
                    <AvatarFallback className={`${accent.iconBg} ${accent.iconText} text-[9px] font-semibold`}>
                      {role.names[j] ? getInitials(role.names[j]) : "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {role.count > 4 && (
                <div className="h-8 w-8 rounded-full bg-white/90 ring-2 ring-white/80 flex items-center justify-center">
                  <span className="text-[8px] font-semibold text-gray-400">+{role.count - 4}</span>
                </div>
              )}
            </div>
            <span className="text-[36px] font-semibold text-gray-900/[0.06] tabular-nums leading-none select-none">
              {role.count}
            </span>
          </div>
        </div>
      )}

      {/* ── LARGE — 3 × 144 = 432 area units ── */}
      {variant === "large" && (
        <div className="h-full flex flex-col justify-between p-4">
          <div>
            <p className="text-[16px] font-semibold text-gray-900">{role.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {role.count} {role.count === 1 ? "person" : "people"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {role.avatars.slice(0, 3).map((url, j) => (
                <Avatar key={j} className="h-6 w-6 ring-2 ring-white/80">
                  {url ? (
                    <img src={url} alt="" referrerPolicy="no-referrer" className="aspect-square size-full rounded-full object-cover" />
                  ) : (
                    <AvatarFallback className={`${accent.iconBg} ${accent.iconText} text-[8px] font-semibold`}>
                      {role.names[j] ? getInitials(role.names[j]) : "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
            </div>
            {role.names.length > 0 && (
              <p className="text-[10px] text-gray-400 truncate min-w-0">
                {role.names[0]}{role.count > 1 ? ` +${role.count - 1}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── MEDIUM — 3 × 89 = 267 area units ── */}
      {variant === "medium" && (
        <div className="h-full flex items-center gap-3 px-4">
          <div className="flex -space-x-1.5 shrink-0">
            {role.avatars.slice(0, 2).map((url, j) => (
              <Avatar key={j} className="h-7 w-7 ring-2 ring-white">
                {url ? (
                  <img src={url} alt="" referrerPolicy="no-referrer" className="aspect-square size-full rounded-full object-cover" />
                ) : (
                  <AvatarFallback className={`${accent.iconBg} ${accent.iconText} text-[8px] font-semibold`}>
                    {role.names[j] ? getInitials(role.names[j]) : "?"}
                  </AvatarFallback>
                )}
              </Avatar>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{role.label}</p>
            <p className="text-[10px] text-gray-300 tabular-nums">{role.count} people</p>
          </div>
        </div>
      )}

      {/* ── COMPACT — 2 × 89 = 178 area units ── */}
      {variant === "compact" && (
        <div className="h-full flex flex-col items-center justify-center gap-1.5 px-3">
          <div className={`h-8 w-8 rounded-full ${accent.iconBg} flex items-center justify-center`}>
            <span className={`text-[12px] font-bold ${accent.iconText} tabular-nums`}>{role.count}</span>
          </div>
          <p className="text-[12px] font-semibold text-gray-900 text-center truncate w-full">{role.label}</p>
        </div>
      )}

      {/* ── TINY — 2-3 × 55 = 110-165 area units ── */}
      {variant === "tiny" && (
        <div className="h-full flex items-center gap-2 px-3">
          <div className={`h-6 w-6 rounded-full ${accent.iconBg} flex items-center justify-center shrink-0`}>
            <span className={`text-[9px] font-bold ${accent.iconText} tabular-nums`}>{role.count}</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-900 truncate min-w-0">{role.label}</p>
        </div>
      )}
    </button>
  );
}
