"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Loader2, Check, X } from "lucide-react";

interface ContactEnrichButtonProps {
  contactId: string;
  contact: {
    full_name: string;
    company?: string | null;
    title?: string | null;
    location?: string | null;
    bio?: string | null;
    linkedin_url?: string | null;
    twitter_handle?: string | null;
  };
}

type Status = "idle" | "loading" | "suggestions" | "saving" | "done";

const FIELD_LABELS: Record<string, string> = {
  company: "Company",
  title: "Title",
  location: "Location",
  bio: "Bio",
  linkedin_url: "LinkedIn URL",
  twitter_handle: "Twitter Handle",
};

export function ContactEnrichButton({
  contactId,
  contact,
}: ContactEnrichButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Check if there are missing fields worth enriching
  const hasMissingFields = ["company", "title", "location", "bio", "linkedin_url", "twitter_handle"].some(
    (f) => !contact[f as keyof typeof contact]
  );

  const handleEnrich = async () => {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`/api/contacts/${contactId}/enrich`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.suggestions) {
        const keys = Object.keys(data.suggestions);
        if (keys.length === 0) {
          setError("No additional data found for this contact.");
          setStatus("idle");
          return;
        }
        setSuggestions(data.suggestions);
        setSelected(new Set(keys));
        setStatus("suggestions");
      } else {
        setError(data.error || data.message || "Enrichment failed.");
        setStatus("idle");
      }
    } catch {
      setError("Failed to enrich contact. Please try again.");
      setStatus("idle");
    }
  };

  const handleApply = async () => {
    const fieldsToApply: Record<string, string> = {};
    for (const key of selected) {
      fieldsToApply[key] = suggestions[key];
    }

    if (Object.keys(fieldsToApply).length === 0) {
      setStatus("idle");
      return;
    }

    setStatus("saving");

    try {
      const res = await fetch(`/api/contacts/${contactId}/enrich`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldsToApply }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("done");
        setTimeout(() => {
          router.refresh();
          setStatus("idle");
          setSuggestions({});
          setSelected(new Set());
        }, 1500);
      } else {
        setError(data.error || "Failed to apply changes.");
        setStatus("suggestions");
      }
    } catch {
      setError("Failed to save. Please try again.");
      setStatus("suggestions");
    }
  };

  const toggleField = (field: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  if (!hasMissingFields) return null;

  return (
    <div className="relative">
      <button
        onClick={handleEnrich}
        disabled={status === "loading" || status === "saving"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-900/15 text-xs font-medium text-gray-700 hover:border-gray-900/25 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Enriching...
          </>
        ) : status === "done" ? (
          <>
            <Check className="h-3 w-3 text-green-600" />
            Updated
          </>
        ) : (
          <>
            <Wand2 className="h-3 w-3" />
            Enrich
          </>
        )}
      </button>

      {error && status === "idle" && (
        <div className="absolute right-0 top-full mt-2 z-10 w-64 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-xs text-red-700">
          {error}
        </div>
      )}

      {status === "suggestions" && Object.keys(suggestions).length > 0 && (
        <div className="absolute right-0 top-full mt-2 z-10 w-80 rounded-xl border border-gray-900/10 bg-white shadow-lg">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-900">
                AI Suggestions
              </h3>
              <button
                onClick={() => {
                  setStatus("idle");
                  setSuggestions({});
                }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(suggestions).map(([field, value]) => (
              <label
                key={field}
                className="flex items-start gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(field)}
                  onChange={() => toggleField(field)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500">
                    {FIELD_LABELS[field] || field}
                  </p>
                  <p className="text-xs text-gray-900 truncate">{value}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setStatus("idle");
                setSuggestions({});
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selected.size === 0}
              className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              Apply Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
