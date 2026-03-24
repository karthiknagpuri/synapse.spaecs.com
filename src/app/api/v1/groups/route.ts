import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  // Get groups where user is a member
  const { data: memberships, error: memberError } = await supabaseAdmin
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", auth.user.id);

  if (memberError) {
    return apiError({
      status: 500,
      title: "Internal Server Error",
      detail: "Failed to fetch groups.",
      instance: "/api/v1/groups",
    });
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const groupIds = memberships.map((m) => m.group_id);
  const roleMap = Object.fromEntries(
    memberships.map((m) => [m.group_id, m.role])
  );

  // Fetch group details with member counts
  const { data: groups } = await supabaseAdmin
    .from("groups")
    .select("id, name, description, avatar_url, created_at")
    .in("id", groupIds);

  // Get member counts
  const groupsWithMeta = await Promise.all(
    (groups || []).map(async (g) => {
      const { count } = await supabaseAdmin
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", g.id);

      return {
        ...g,
        role: roleMap[g.id],
        member_count: count || 0,
      };
    })
  );

  return NextResponse.json({ groups: groupsWithMeta });
}
