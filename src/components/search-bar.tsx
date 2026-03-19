"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your network in plain English..."
          className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-600 animate-spin" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 justify-center">
        {[
          "Founders in Hyderabad",
          "People I emailed last month",
          "Designers at startups",
          "VCs I met this year",
        ].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuery(suggestion)}
            className="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </form>
  );
}
