"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronRight,
  Users,
  Layers,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

interface PipelineItem {
  id: string;
  name: string;
  description: string | null;
  type: "fundraising" | "hiring" | "sales" | "custom";
  stage_count: number;
  card_count: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  fundraising: "Fundraising",
  hiring: "Hiring",
  sales: "Sales",
  custom: "Custom",
};

export function PipelinesList({
  pipelines,
}: {
  pipelines: PipelineItem[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("custom");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        setName("");
        setType("custom");
        setDescription("");
        router.push(`/dashboard/pipelines/${data.pipeline.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* New Pipeline */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
        >
          <Plus className="h-3 w-3" />
          New Pipeline
        </button>
      ) : (
        <div className="p-5 rounded-xl border border-gray-900/10 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">
              Create Pipeline
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setName("");
                setType("custom");
                setDescription("");
              }}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Series A Investors"
                  className="w-full h-9 px-3 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all bg-white"
                >
                  <option value="fundraising">Fundraising</option>
                  <option value="hiring">Hiring</option>
                  <option value="sales">Sales</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="w-full h-9 px-3 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Create"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setType("custom");
                  setDescription("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pipeline List */}
      {pipelines.length > 0 && (
        <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="group flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <Link
                href={`/dashboard/pipelines/${pipeline.id}`}
                className="flex-1 flex items-center gap-3 px-5 py-4 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pipeline.name}
                    </p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 bg-gray-100">
                      {TYPE_LABELS[pipeline.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Layers className="h-3 w-3" />
                      {pipeline.stage_count} stages
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      {pipeline.card_count} contacts
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(pipeline.id);
                }}
                className="mr-3 p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete pipeline"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
