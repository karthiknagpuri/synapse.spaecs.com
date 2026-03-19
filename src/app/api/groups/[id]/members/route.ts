import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/groups/:id/members — add a member to the group
export async function POST(
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

  // Check caller is owner or admin
  const { data: callerMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json(
      { error: "user_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("group_members")
    .insert({ group_id: id, user_id, role: "member" })
    .select("*, profile:profiles(*)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already a member" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data });
}

// DELETE /api/groups/:id/members — remove a member
export async function DELETE(
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
  const { user_id } = body;

  // Allow self-removal or admin removal
  if (user_id !== user.id) {
    const { data: callerMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .single();

    if (
      !callerMembership ||
      !["owner", "admin"].includes(callerMembership.role)
    ) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", id)
    .eq("user_id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
