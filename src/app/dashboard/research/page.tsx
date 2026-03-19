"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  Clock,
  ChevronRight,
  Telescope,
  CalendarCheck,
} from "lucide-react";

const EXAMPLE_CHIPS = [
  { name: "Satya Nadella", detail: "CEO of Microsoft" },
  { name: "Jensen Huang", detail: "NVIDIA" },
  { name: "Sam Altman", detail: "OpenAI" },
  { name: "Joanne Jang", detail: "OpenAI" },
  { name: "@bgurley", detail: "on Twitter" },
  { name: "Aryna Sabalenka", detail: "tennis" },
];

interface ResearchEntry {
  id: string;
  query_name: string;
  query_context: string | null;
  status: string;
  processing_time_ms: number | null;
  created_at: string;
}

export default function ResearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [contactId] = useState(searchParams.get("contact_id") || "");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ResearchEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [autoStarted, setAutoStarted] = useState(false);
  const [autoResearch, setAutoResearch] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const name = searchParams.get("name");
    const context = searchParams.get("context");
    if (name) {
      setInput(context ? `${name}, ${context}` : name);
      if (!autoStarted) {
        setAutoStarted(true);
        startResearch(name, context || undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/research?limit=20");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.profiles || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  async function startResearch(nameOverride?: string, contextOverride?: string) {
    const raw = nameOverride || input;
    if (!raw.trim() || loading) return;
    setLoading(true);

    // Parse "Name, context" format
    const parts = raw.split(",").map((s) => s.trim());
    const name = parts[0];
    const context = contextOverride || parts.slice(1).join(", ") || undefined;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          context,
          contact_id: contactId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/research/${data.id}`);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const handleChipClick = (chip: { name: string; detail: string }) => {
    const value = `${chip.name}, ${chip.detail}`;
    setInput(value);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">
          Research a Person
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Write a name and one detail. AI builds a complete profile.
        </p>
      </div>

      {/* Search Form */}
      <div className="p-6 rounded-xl border border-gray-900/10 bg-white space-y-4">
        <div className="relative">
          <Telescope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Sam Altman, CEO of OpenAI"
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-900/15 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
            onKeyDown={(e) => e.key === "Enter" && startResearch()}
          />
        </div>

        {/* Example Chips */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.name}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-900/15 text-xs text-gray-600 hover:border-gray-900/25 transition-colors"
            >
              <span className="font-medium text-gray-900">{chip.name}</span>
              <span className="text-gray-400">{chip.detail}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => startResearch()}
          disabled={!input.trim() || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting research...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Research
            </>
          )}
        </button>
      </div>

      {/* Auto-Research Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-900/10 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100">
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                Auto-research before meetings
              </p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 uppercase tracking-wider">
                Beta
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Automatically research attendees before your calendar events
            </p>
          </div>
        </div>
        <button
          onClick={() => setAutoResearch(!autoResearch)}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            autoResearch ? "bg-[#0A0A0A]" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              autoResearch ? "left-5" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Research History */}
      <div>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Recent Research
        </h2>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Telescope className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No research yet. Try searching for someone above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() =>
                  router.push(`/dashboard/research/${entry.id}`)
                }
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-600 text-xs font-medium shrink-0">
                  {entry.query_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {entry.query_name}
                  </p>
                  {entry.query_context && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {entry.query_context}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={entry.status} />
                  {entry.processing_time_ms && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {(entry.processing_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    researching: "bg-blue-50 text-blue-700",
    completed: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {status === "researching" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {status}
    </span>
  );
}
