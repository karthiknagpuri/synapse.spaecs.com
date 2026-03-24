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
  const instance = `/api/v1/research/${id}`;

  const { data: research, error } = await supabaseAdmin
    .from("research_profiles")
    .select("id, user_id, query_name, query_context, status, profile_data, sources, processing_time_ms, error_message, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !research) {
    return apiError({
      status: 404,
      title: "Not Found",
      detail: `Research job '${id}' not found.`,
      instance,
    });
  }

  if (research.user_id !== auth.user.id) {
    return apiError({
      status: 404,
      title: "Not Found",
      detail: `Research job '${id}' not found.`,
      instance,
    });
  }

  // Map internal status to API status
  const statusMap: Record<string, string> = {
    pending: "PENDING",
    researching: "PROCESSING",
    completed: "COMPLETED",
    failed: "FAILED",
  };

  const response: Record<string, any> = {
    id: research.id,
    status: statusMap[research.status] || research.status.toUpperCase(),
    description: research.query_name,
    created_at: research.created_at,
    updated_at: research.updated_at,
  };

  if (research.status === "completed") {
    response.profile = research.profile_data;
    response.sources = research.sources;
    response.processing_time_ms = research.processing_time_ms;
  }

  if (research.status === "failed") {
    response.error = research.error_message;
  }

  return NextResponse.json(response);
}
