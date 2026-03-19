import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/groups/:id — get group details with members
export async function GET(
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

  // Get group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Get members with profiles
  const { data: members } = await supabase
    .from("group_members")
    .select("*, profile:profiles(*)")
    .eq("group_id", id)
    .order("joined_at", { ascending: true });

  // Check current user is a member
  const isMember = (members || []).some((m) => m.user_id === user.id);
  if (!isMember) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const currentRole = (members || []).find(
    (m) => m.user_id === user.id
  )?.role;

  return NextResponse.json({
    group: { ...group, member_count: (members || []).length },
    members: members || [],
    current_role: currentRole,
  });
}

// PATCH /api/groups/:id — update group
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
  const updates: Record<string, string | null> = {};

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined)
    updates.description = body.description?.trim() || null;

  const { error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/groups/:id — delete group
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

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
