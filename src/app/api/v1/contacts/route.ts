import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const sort = searchParams.get("sort") || "full_name";
  const order = searchParams.get("order") === "desc" ? false : true;

  const allowedSorts = ["full_name", "company", "relationship_score", "last_interaction_at", "created_at"];
  const sortField = allowedSorts.includes(sort) ? sort : "full_name";

  const { data: contacts, error, count } = await supabaseAdmin
    .from("contacts")
    .select(
      "id, full_name, email, phone, company, title, location, bio, linkedin_url, twitter_handle, avatar_url, tags, source, relationship_score, last_interaction_at, interaction_count, created_at",
      { count: "exact" }
    )
    .eq("user_id", auth.user.id)
    .order(sortField, { ascending: order })
    .range(offset, offset + limit - 1);

  if (error) {
    return apiError({
      status: 500,
      title: "Internal Server Error",
      detail: "Failed to fetch contacts.",
      instance: "/api/v1/contacts",
    });
  }

  return NextResponse.json({
    contacts: contacts || [],
    total: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  });
}
