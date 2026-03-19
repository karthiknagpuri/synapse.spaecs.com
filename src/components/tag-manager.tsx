"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Wand2,
  Check,
  X,
  Tag,
} from "lucide-react";
import type { TagDefinition } from "@/types";

const PRESET_COLORS = [
  "#6B7280",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
];

const SUGGESTED_TAGS = [
  {
    name: "Investor",
    criteria: "Works in venture capital, angel investing, or private equity",
    color: "#F59E0B",
  },
  {
    name: "Engineer",
    criteria: "Software engineer, developer, or technical role",
    color: "#3B82F6",
  },
  {
    name: "Founder",
    criteria: "CEO, founder, or co-founder of a company",
    color: "#8B5CF6",
  },
  {
    name: "Designer",
    criteria: "UX, UI, product, or graphic designer",
    color: "#10B981",
  },
];

export default function TagManager() {
  const [tags, setTags] = useState<TagDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [autoTagResult, setAutoTagResult] = useState<{
    tagged: number;
    total: number;
  } | null>(null);

  // New tag form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCriteria, setFormCriteria] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formAutoAssign, setFormAutoAssign] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCriteria, setEditCriteria] = useState("");
  const [editColor, setEditColor] = useState("");

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (data.tags) setTags(data.tags);
    } catch {
      console.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    if (!formName.trim() || !formCriteria.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          criteria: formCriteria.trim(),
          color: formColor,
          auto_assign: formAutoAssign,
        }),
      });

      const data = await res.json();
      if (data.tag) {
        setTags((prev) => [data.tag, ...prev]);
        resetForm();
      }
    } catch {
      console.error("Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      console.error("Failed to delete tag");
    }
  };

  const handleToggleAutoAssign = async (tag: TagDefinition) => {
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_assign: !tag.auto_assign }),
      });
      const data = await res.json();
      if (data.tag) {
        setTags((prev) => prev.map((t) => (t.id === tag.id ? data.tag : t)));
      }
    } catch {
      console.error("Failed to update tag");
    }
  };

  const startEdit = (tag: TagDefinition) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditCriteria(tag.criteria);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim() || !editCriteria.trim()) return;

    try {
      const res = await fetch(`/api/tags/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          criteria: editCriteria.trim(),
          color: editColor,
        }),
      });
      const data = await res.json();
      if (data.tag) {
        setTags((prev) =>
          prev.map((t) => (t.id === editingId ? data.tag : t))
        );
      }
    } catch {
      console.error("Failed to update tag");
    } finally {
      setEditingId(null);
    }
  };

  const handleAutoTag = async () => {
    setAutoTagging(true);
    setAutoTagResult(null);
    try {
      const res = await fetch("/api/tags/auto-tag", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setAutoTagResult(null);
        alert(data.error);
      } else {
        setAutoTagResult({ tagged: data.tagged, total: data.total });
      }
    } catch {
      console.error("Auto-tag failed");
    } finally {
      setAutoTagging(false);
    }
  };

  const handleUseSuggestion = (suggestion: (typeof SUGGESTED_TAGS)[0]) => {
    setFormName(suggestion.name);
    setFormCriteria(suggestion.criteria);
    setFormColor(suggestion.color);
    setFormAutoAssign(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormName("");
    setFormCriteria("");
    setFormColor(PRESET_COLORS[0]);
    setFormAutoAssign(true);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Tag
            </Button>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAutoTag}
          disabled={autoTagging || tags.filter((t) => t.auto_assign).length === 0}
          className="gap-1.5 text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
        >
          {autoTagging ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {autoTagging ? "Tagging..." : "Run Auto-Tag"}
        </Button>
      </div>

      {/* Auto-tag result */}
      {autoTagResult && (
        <div className="flex items-center gap-2 rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 px-4 py-3">
          <Check className="h-4 w-4 text-[#7C3AED]" />
          <p className="text-sm text-gray-700">
            Tagged{" "}
            <span className="font-medium text-gray-900">
              {autoTagResult.tagged}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900">
              {autoTagResult.total}
            </span>{" "}
            contacts
          </p>
        </div>
      )}

      {/* New tag form */}
      {showForm && (
        <div className="rounded-xl border border-gray-900/10 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">New Tag</h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Tag name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="text-sm"
            />

            <textarea
              placeholder="Matching criteria (e.g. 'Works in venture capital, angel investing, or private equity')"
              value={formCriteria}
              onChange={(e) => setFormCriteria(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />

            {/* Color picker */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Color</span>
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className="h-6 w-6 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      boxShadow:
                        formColor === c
                          ? `0 0 0 2px white, 0 0 0 3.5px ${c}`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Auto-assign toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={formAutoAssign}
                onClick={() => setFormAutoAssign(!formAutoAssign)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                  formAutoAssign ? "bg-[#7C3AED]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                    formAutoAssign ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">Auto-assign with AI</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving || !formName.trim() || !formCriteria.trim()}
              className="gap-1.5 text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create Tag
            </Button>
          </div>
        </div>
      )}

      {/* Suggestions (only show when no tags exist) */}
      {tags.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 space-y-3">
          <p className="text-xs text-gray-500">
            Suggested tags to get started
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((s) => (
              <button
                key={s.name}
                onClick={() => handleUseSuggestion(s)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag list */}
      {tags.length > 0 && (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group rounded-xl border border-gray-900/10 bg-white p-4 transition-colors hover:border-gray-900/15"
            >
              {editingId === tag.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-sm"
                  />
                  <textarea
                    value={editCriteria}
                    onChange={(e) => setEditCriteria(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Color</span>
                    <div className="flex gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className="h-5 w-5 rounded-full transition-all"
                          style={{
                            backgroundColor: c,
                            boxShadow:
                              editColor === c
                                ? `0 0 0 2px white, 0 0 0 3px ${c}`
                                : "none",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="mt-0.5 h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {tag.name}
                        </span>
                        {tag.auto_assign && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED]">
                            <Wand2 className="h-2.5 w-2.5" />
                            Auto
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {tag.criteria}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {/* Auto-assign toggle */}
                    <button
                      onClick={() => handleToggleAutoAssign(tag)}
                      title={
                        tag.auto_assign
                          ? "Disable auto-assign"
                          : "Enable auto-assign"
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                        tag.auto_assign ? "bg-[#7C3AED]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                          tag.auto_assign
                            ? "translate-x-4 ml-0.5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => startEdit(tag)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {tags.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Tag className="h-8 w-8 text-gray-300 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">
            No tags yet. Create one or use a suggestion above.
          </p>
        </div>
      )}
    </div>
  );
}
