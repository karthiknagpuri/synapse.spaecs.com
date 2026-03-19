import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { FriendActionButton } from "@/components/friend-action-button";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // If viewing own profile, redirect to /dashboard/profile
  if (id === user.id) {
    redirect("/dashboard/profile");
  }

  // Fetch the target user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // Check friendship status
  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, created_at")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`
    )
    .limit(1);

  const friendship = friendships?.[0] || null;
  const isFriend = !!friendship;

  // Check pending request
  let pendingDirection: "sent" | "received" | null = null;
  let pendingRequestId: string | null = null;
  if (!isFriend) {
    const { data: requests } = await supabase
      .from("friend_requests")
      .select("id, from_user_id")
      .or(
        `and(from_user_id.eq.${user.id},to_user_id.eq.${id}),and(from_user_id.eq.${id},to_user_id.eq.${user.id})`
      )
      .eq("status", "pending")
      .limit(1);

    if (requests?.[0]) {
      pendingRequestId = requests[0].id;
      pendingDirection =
        requests[0].from_user_id === user.id ? "sent" : "received";
    }
  }

  // Get mutual friends
  const { data: myFriends } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  const { data: theirFriends } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${id},friend_id.eq.${id}`);

  const myFriendIds = new Set(
    (myFriends || []).map((f) =>
      f.user_id === user.id ? f.friend_id : f.user_id
    )
  );
  const theirFriendIds = new Set(
    (theirFriends || []).map((f) =>
      f.user_id === id ? f.friend_id : f.user_id
    )
  );
  const mutualIds = [...myFriendIds].filter((fid) => theirFriendIds.has(fid));

  // Get mutual friend profiles
  let mutualProfiles: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
  if (mutualIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", mutualIds.slice(0, 6));
    mutualProfiles = data || [];
  }

  const friendsSince = friendship
    ? new Date(friendship.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/friends"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ""}
                referrerPolicy="no-referrer"
                className="aspect-square size-full rounded-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl font-medium">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-serif)] text-[28px] text-gray-900 leading-tight">
              {profile.full_name || "Synapse User"}
            </h1>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                Member since {memberSince}
              </div>
              {isFriend && friendsSince && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  Friends since {friendsSince}
                </div>
              )}
            </div>
            <div className="mt-4">
              <FriendActionButton
                targetUserId={id}
                isFriend={isFriend}
                friendshipId={friendship?.id || null}
                pendingDirection={pendingDirection}
                pendingRequestId={pendingRequestId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mutual Friends */}
      {mutualProfiles.length > 0 && (
        <div>
          <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-widest mb-3 px-1">
            {mutualIds.length} Mutual Friend{mutualIds.length !== 1 ? "s" : ""}
          </h2>
          <div className="rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] divide-y divide-gray-100/60">
            {mutualProfiles.map((mutual) => {
              const mInitials = mutual.full_name
                ? mutual.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "?";
              return (
                <Link
                  key={mutual.id}
                  href={`/dashboard/profile/${mutual.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    {mutual.avatar_url ? (
                      <img
                        src={mutual.avatar_url}
                        alt={mutual.full_name || ""}
                        referrerPolicy="no-referrer"
                        className="aspect-square size-full rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gray-50 text-gray-400 text-[10px] font-medium">
                        {mInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <p className="text-sm font-medium text-gray-900">
                    {mutual.full_name || "Synapse User"}
                  </p>
                </Link>
              );
            })}
            {mutualIds.length > 6 && (
              <div className="px-5 py-3 text-xs text-gray-400">
                +{mutualIds.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state when no mutual friends and not friends */}
      {!isFriend && mutualProfiles.length === 0 && !pendingDirection && (
        <div className="rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)] p-8 text-center">
          <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">No mutual friends</p>
          <p className="text-xs text-gray-400 mt-1">
            Add {profile.full_name?.split(" ")[0] || "them"} as a friend to see
            shared connections.
          </p>
        </div>
      )}
    </div>
  );
}
