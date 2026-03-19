"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import type { Group } from "@/types";
import { AccelerationBoard } from "@/components/acceleration-board";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CirclesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function createCircle() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [data.group, ...prev]);
        setName("");
        setDescription("");
        setShowCreate(false);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-2xl text-gray-900">
            Circles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your inner circles — frameworks, advisors, and collaborators.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
        >
          <Plus className="h-3 w-3" />
          New Circle
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">
              Create a Circle
            </h2>
            <button
              onClick={() => setShowCreate(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Circle name"
            className="w-full h-9 px-3 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
            onKeyDown={(e) => e.key === "Enter" && createCircle()}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={createCircle}
              disabled={!name.trim() || creating}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Custom Circles */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : groups.length > 0 ? (
        <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => router.push(`/dashboard/groups/${group.id}`)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {initials(group.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {group.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {group.member_count || 0}{" "}
                    {group.member_count === 1 ? "member" : "members"}
                    {group.description && ` · ${group.description}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Framework circles (Acceleration Board + Board of Directors) */}
      <AccelerationBoard
        onCircleCreated={(circle) => {
          setGroups((prev) => [circle as Group, ...prev]);
        }}
      />
    </div>
  );
}
