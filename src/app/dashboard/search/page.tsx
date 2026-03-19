"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ContactCard } from "@/components/contact-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowLeft, Loader2, X } from "lucide-react";
import type { SearchResult } from "@/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const scope = searchParams.get("scope") || "connections";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [editQuery, setEditQuery] = useState(query);

  useEffect(() => {
    if (!query) return;
    setEditQuery(query);

    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [query]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuery.trim()) return;
    router.push(
      `/dashboard/search?q=${encodeURIComponent(editQuery.trim())}&scope=${scope}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + Inline Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>

        <form onSubmit={handleNewSearch} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={editQuery}
            onChange={(e) => setEditQuery(e.target.value)}
            placeholder="Search your network..."
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-gray-900/15 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900/25 transition-all"
          />
          {editQuery && (
            <button
              type="button"
              onClick={() => setEditQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </form>
      </div>

      {/* Scope indicator */}
      {scope === "connections" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0A0A0A] text-white">
            Your connections
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-gray-900/10 bg-white"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">
            No results found
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Try a different query or connect more platforms to expand your
            network.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {results.length} result{results.length !== 1 && "s"} for
              &quot;{query}&quot;
            </p>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          {results.map((result) => (
            <ContactCard
              key={result.contact_id}
              result={result}
              whyMatched={result.why_matched}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
