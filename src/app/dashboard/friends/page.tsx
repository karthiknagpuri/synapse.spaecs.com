"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  Check,
  X,
  Copy,
  Mail,
  Link2,
  UserMinus,
  Clock,
  Compass,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";

type Tab = "friends" | "requests" | "suggestions" | "invite";

interface FriendEntry {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend: Profile | null;
}

interface IncomingRequest {
  id: string;
  from_user_id: string;
  status: string;
  created_at: string;
  from_profile: Profile | null;
}

interface OutgoingRequest {
  id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  to_profile: Profile | null;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [actioning, setActioning] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "friends") {
        const res = await fetch("/api/friends?tab=friends");
        const data = await res.json();
        setFriends(data.friends || []);
      } else if (tab === "requests") {
        const res = await fetch("/api/friends?tab=requests");
        const data = await res.json();
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
      } else if (tab === "suggestions") {
        const res = await fetch("/api/friends?tab=suggestions");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendRequest = async (toUserId: string) => {
    setSentRequests((prev) => new Set(prev).add(toUserId));
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: toUserId }),
      });
    } catch {
      setSentRequests((prev) => {
        const next = new Set(prev);
        next.delete(toUserId);
        return next;
      });
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "accept" | "decline"
  ) => {
    setActioning((prev) => new Set(prev).add(requestId));
    try {
      await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      // ignore
    } finally {
      setActioning((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    setActioning((prev) => new Set(prev).add(friendshipId));
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch {
      // ignore
    } finally {
      setActioning((prev) => {
        const next = new Set(prev);
        next.delete(friendshipId);
        return next;
      });
    }
  };

  const generateInviteLink = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setInviteLink(data.invite_url);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const sendEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      setInviteEmail("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredFriends = friends.filter((f) => {
    if (!search) return true;
    const name = f.friend?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Friends", count: friends.length },
    {
      id: "requests",
      label: "Requests",
      count: incoming.length,
    },
    { id: "suggestions", label: "Discover" },
    { id: "invite", label: "Invite" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">Friends</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect with others on Synapse.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-900/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t.id
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`ml-1.5 text-xs tabular-nums ${
                  tab === t.id ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A0A0A] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {tab === "friends" && (
        <div className="space-y-4">
          {friends.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search friends..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">
                {search ? "No matches" : "No friends yet"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {search
                  ? "Try a different search."
                  : "Discover people and send requests to connect."}
              </p>
              {!search && (
                <button
                  onClick={() => setTab("suggestions")}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Discover People
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
              {filteredFriends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <Link
                    href={`/dashboard/profile/${f.friend?.id || f.friend_id}`}
                    className="flex items-center gap-3 min-w-0 group/link"
                  >
                    {f.friend?.avatar_url ? (
                      <img
                        src={f.friend.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                        {initials(f.friend?.full_name || null)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover/link:text-gray-600 transition-colors">
                        {f.friend?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Friends since{" "}
                        {new Date(f.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFriend(f.id)}
                    disabled={actioning.has(f.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                  >
                    {actioning.has(f.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                    ) : (
                      <UserMinus className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {tab === "requests" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Incoming */}
              <section>
                <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Received
                </h2>
                {incoming.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-gray-900/10 bg-white">
                    <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No pending requests.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
                    {incoming.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {r.from_profile?.avatar_url ? (
                            <img
                              src={r.from_profile.avatar_url}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                              {initials(r.from_profile?.full_name || null)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {r.from_profile?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRequest(r.id, "accept")}
                            disabled={actioning.has(r.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequest(r.id, "decline")}
                            disabled={actioning.has(r.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Outgoing */}
              {outgoing.length > 0 && (
                <section>
                  <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Sent
                  </h2>
                  <div className="divide-y divide-gray-900/5 border border-gray-900/10 rounded-xl bg-white">
                    {outgoing.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {r.to_profile?.avatar_url ? (
                            <img
                              src={r.to_profile.avatar_url}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                              {initials(r.to_profile?.full_name || null)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {r.to_profile?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Pending since{" "}
                              {new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Suggestions */}
      {tab === "suggestions" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
              <Compass className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">
                No suggestions right now
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Invite people to join Synapse to grow your network.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 rounded-xl border border-gray-900/10 bg-white flex items-center gap-3"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500 shrink-0">
                      {initials(profile.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">Synapse member</p>
                  </div>
                  <button
                    onClick={() => sendRequest(profile.id)}
                    disabled={sentRequests.has(profile.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {sentRequests.has(profile.id) ? (
                      <>
                        <Check className="h-3 w-3" />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite */}
      {tab === "invite" && (
        <div className="space-y-6">
          {/* Invite Link */}
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-900">
                Invite Link
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Share this link with anyone to invite them to Synapse.
            </p>
            {inviteLink ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-gray-100 border border-gray-900/10 text-sm font-mono text-gray-700 truncate select-all">
                  {inviteLink}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="p-2 rounded-lg border border-gray-900/10 hover:bg-gray-100 transition-colors shrink-0"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={generateInviteLink}
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                Generate Link
              </button>
            )}
          </div>

          {/* Email Invite */}
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-900">
                Invite by Email
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Send an invite directly to someone&apos;s email.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 h-9 px-3 rounded-lg border border-gray-900/10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                onKeyDown={(e) => e.key === "Enter" && sendEmailInvite()}
              />
              <button
                onClick={sendEmailInvite}
                disabled={!inviteEmail.trim() || sending}
                className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
