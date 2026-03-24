import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const instance = `/api/v1/contacts/${id}`;

  const { data: contact, error } = await supabaseAdmin
    .from("contacts")
    .select(
      "id, full_name, email, phone, company, title, location, bio, linkedin_url, twitter_handle, avatar_url, tags, source, relationship_score, last_interaction_at, interaction_count, created_at, updated_at"
    )
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !contact) {
    return apiError({
      status: 404,
      title: "Not Found",
      detail: `Contact '${id}' not found.`,
      instance,
    });
  }

  // Fetch recent interactions
  const { data: interactions } = await supabaseAdmin
    .from("interactions")
    .select("id, type, platform, subject, occurred_at")
    .eq("contact_id", id)
    .eq("user_id", auth.user.id)
    .order("occurred_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    ...contact,
    recent_interactions: interactions || [],
  });
}
