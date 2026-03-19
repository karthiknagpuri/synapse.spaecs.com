import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/friends/:id — accept or decline a friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body; // "accept" or "decline"

  if (!["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Fetch the request (must be addressed to current user)
  const { data: friendRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", id)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !friendRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "accept") {
    // Create bidirectional friendship
    const { error: friendError1 } = await supabase
      .from("friendships")
      .insert({ user_id: user.id, friend_id: friendRequest.from_user_id });

    if (friendError1) {
      return NextResponse.json(
        { error: friendError1.message },
        { status: 500 }
      );
    }

    // Update request status
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", id);

    return NextResponse.json({ success: true, action: "accepted" });
  }

  // Decline
  await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", id);

  return NextResponse.json({ success: true, action: "declined" });
}

// DELETE /api/friends/:id — remove a friendship
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete friendship where user is either side
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", id)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
