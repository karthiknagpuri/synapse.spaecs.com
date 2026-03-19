import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/friends — list friends, incoming requests, and suggestions
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tab = request.nextUrl.searchParams.get("tab") || "friends";

  if (tab === "requests") {
    const { data: incoming } = await supabase
      .from("friend_requests")
      .select("*, from_profile:profiles!friend_requests_from_user_id_fkey(*)")
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const { data: outgoing } = await supabase
      .from("friend_requests")
      .select("*, to_profile:profiles!friend_requests_to_user_id_fkey(*)")
      .eq("from_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      incoming: incoming || [],
      outgoing: outgoing || [],
    });
  }

  if (tab === "suggestions") {
    // Get existing friend IDs
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id, user_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    const friendIds = new Set<string>();
    friendIds.add(user.id);
    (friendships || []).forEach((f) => {
      friendIds.add(f.user_id === user.id ? f.friend_id : f.user_id);
    });

    // Get pending request IDs
    const { data: pendingRequests } = await supabase
      .from("friend_requests")
      .select("from_user_id, to_user_id")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .eq("status", "pending");

    (pendingRequests || []).forEach((r) => {
      friendIds.add(r.from_user_id);
      friendIds.add(r.to_user_id);
    });

    // Get profiles that are not friends yet
    const { data: suggestions } = await supabase
      .from("profiles")
      .select("*")
      .not("id", "in", `(${Array.from(friendIds).join(",")})`)
      .limit(12);

    return NextResponse.json({ suggestions: suggestions || [] });
  }

  // Default: friends list
  const { data: friendships } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!friendships || friendships.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const friendIds = friendships.map((f) =>
    f.user_id === user.id ? f.friend_id : f.user_id
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", friendIds);

  const friendsWithProfiles = friendships.map((f) => {
    const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
    return {
      ...f,
      friend: (profiles || []).find((p) => p.id === friendId) || null,
    };
  });

  return NextResponse.json({ friends: friendsWithProfiles });
}

// POST /api/friends — send friend request
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { to_user_id } = body;

  if (!to_user_id || to_user_id === user.id) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check if already friends
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${to_user_id}),and(user_id.eq.${to_user_id},friend_id.eq.${user.id})`
    )
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already friends" }, { status: 409 });
  }

  // Check for existing pending request
  const { data: pendingCheck } = await supabase
    .from("friend_requests")
    .select("id")
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${to_user_id}),and(from_user_id.eq.${to_user_id},to_user_id.eq.${user.id})`
    )
    .eq("status", "pending")
    .limit(1);

  if (pendingCheck && pendingCheck.length > 0) {
    return NextResponse.json(
      { error: "Request already pending" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ from_user_id: user.id, to_user_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data });
}
