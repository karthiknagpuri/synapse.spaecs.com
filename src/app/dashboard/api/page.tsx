"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  Code,
  Terminal,
  ExternalLink,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/search",
    description: "Search your network with natural language",
  },
  {
    method: "GET",
    path: "/api/research",
    description: "List research profiles",
  },
  {
    method: "POST",
    path: "/api/research",
    description: "Start a new person research",
  },
  {
    method: "GET",
    path: "/api/research/:id",
    description: "Get research profile by ID",
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X POST https://synapseai.com/api/search \\
  -H "Authorization: Bearer syn_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "founders in San Francisco"}'`,
  python: `import requests

response = requests.post(
    "https://synapseai.com/api/search",
    headers={
        "Authorization": "Bearer syn_your_key_here",
        "Content-Type": "application/json",
    },
    json={"query": "founders in San Francisco"},
)

results = response.json()
print(results)`,
  javascript: `const response = await fetch("https://synapseai.com/api/search", {
  method: "POST",
  headers: {
    Authorization: "Bearer syn_your_key_here",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "founders in San Francisco" }),
});

const results = await response.json();
console.log(results);`,
};

export default function ApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "javascript">(
    "curl"
  );

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || "Default" }),
      });
      if (res.ok) {
        const data = await res.json();
        setJustCreatedKey(data.key.key);
        setNewKeyName("");
        setShowCreate(false);
        fetchKeys();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeys();
        if (justCreatedKey) setJustCreatedKey(null);
      }
    } catch {
      // ignore
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">API</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Access your network data programmatically.
        </p>
      </div>

      {/* Just Created Key Warning */}
      {justCreatedKey && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Save your API key — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-amber-200 text-sm font-mono text-amber-900 select-all">
              {justCreatedKey}
            </code>
            <button
              onClick={() => copyToClipboard(justCreatedKey, "new")}
              className="p-2 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              {copiedId === "new" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-amber-700" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* API Keys */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            API Keys
          </h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Key
          </button>
        </div>

        {showCreate && (
          <div className="p-4 rounded-xl border border-gray-900/10 bg-white mb-3 flex items-center gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production)"
              className="flex-1 h-9 px-3 rounded-lg border border-gray-900/15 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              onKeyDown={(e) => e.key === "Enter" && createKey()}
            />
            <button
              onClick={createKey}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : activeKeys.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-gray-900/10 bg-white">
            <Key className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
            {activeKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Key className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {apiKey.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {apiKey.key}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(apiKey.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {copiedId === apiKey.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => revokeKey(apiKey.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Endpoints */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Endpoints
        </h2>
        <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  ep.method === "GET"
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {ep.method}
              </span>
              <code className="text-sm font-mono text-gray-900">
                {ep.path}
              </code>
              <span className="text-xs text-gray-400 ml-auto hidden sm:block">
                {ep.description}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Code Examples */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Quick Start
        </h2>
        <div className="rounded-xl border border-gray-900/10 bg-white overflow-hidden">
          <div className="flex border-b border-gray-900/5">
            {(["curl", "python", "javascript"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#0A0A0A] text-white rounded-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "curl" ? (
                  <Terminal className="h-3 w-3" />
                ) : (
                  <Code className="h-3 w-3" />
                )}
                {tab === "curl"
                  ? "cURL"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="p-4 text-xs font-mono text-gray-700 overflow-x-auto leading-relaxed">
              {CODE_EXAMPLES[activeTab]}
            </pre>
            <button
              onClick={() =>
                copyToClipboard(CODE_EXAMPLES[activeTab], activeTab)
              }
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {copiedId === activeTab ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section>
        <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Rate Limits
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-gray-900/10 bg-white">
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              100
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Requests / day</p>
            <p className="text-xs text-gray-400 mt-1">Free plan</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-900/10 bg-white">
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              10,000
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Requests / day</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-gray-400">Pro plan</p>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
