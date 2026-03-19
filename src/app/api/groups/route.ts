import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/groups — list user's groups with member counts
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get groups user is a member of
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const groupIds = memberships.map((m) => m.group_id);

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  // Get member counts
  const { data: counts } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const countMap: Record<string, number> = {};
  (counts || []).forEach((c) => {
    countMap[c.group_id] = (countMap[c.group_id] || 0) + 1;
  });

  const enriched = (groups || []).map((g) => ({
    ...g,
    member_count: countMap[g.id] || 0,
  }));

  return NextResponse.json({ groups: enriched });
}

// POST /api/groups — create a new group
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Group name is required" },
      { status: 400 }
    );
  }

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError) {
    console.error("Group create error:", groupError.message, groupError.code, groupError.details);
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  // Add creator as owner
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ group: { ...group, member_count: 1 } });
}
