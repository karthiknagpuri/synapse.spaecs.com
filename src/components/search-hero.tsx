"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, ScanLine, ArrowRight } from "lucide-react";
import Link from "next/link";

const SUGGESTIONS = [
  "Founders in San Francisco",
  "People I emailed last month",
  "Designers at startups",
  "VCs I met this year",
  "Engineers at Google",
  "Investors in AI",
];

export function SearchHero() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    router.push(
      `/dashboard/search?q=${encodeURIComponent(query.trim())}&scope=connections`
    );
  };

  return (
    <div className="pt-8 pb-2 text-center space-y-5">
      <div className="space-y-1.5">
        <h1 className="font-[family-name:var(--font-serif)] text-[28px] text-gray-900 leading-tight">
          Who are you looking for?
        </h1>
        <p className="text-[13px] text-gray-400">
          Search your network in plain English
        </p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-lg mx-auto">
        <div
          className={`relative rounded-2xl transition-all duration-300 ${
            isFocused
              ? "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)]"
              : "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)]"
          }`}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-gray-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Try &quot;founders in AI&quot; or &quot;people at Google&quot;"
            className="w-full h-12 pl-11 pr-24 rounded-2xl bg-white text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isSearching ? (
              <Loader2 className="h-4 w-4 text-gray-300 animate-spin mr-1" />
            ) : (
              query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-gray-300" />
                </button>
              )
            )}
            <Link
              href="/dashboard/import/business-card"
              className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
              title="Scan business card"
            >
              <ScanLine className="h-4 w-4 text-gray-300" />
            </Link>
            {query.trim() && (
              <button
                type="submit"
                className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1.5 rounded-full text-[11px] tracking-wide text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-all duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

    </div>
  );
}
