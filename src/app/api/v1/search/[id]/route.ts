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
  const instance = `/api/v1/search/${id}`;

  const { data: job, error } = await supabaseAdmin
    .from("search_jobs")
    .select("id, user_id, text, status, results, has_more, error_message, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !job) {
    return apiError({
      status: 404,
      title: "Not Found",
      detail: `Search job '${id}' not found.`,
      instance,
    });
  }

  // Ensure the job belongs to this user
  if (job.user_id !== auth.user.id) {
    return apiError({
      status: 404,
      title: "Not Found",
      detail: `Search job '${id}' not found.`,
      instance,
    });
  }

  const response: Record<string, any> = {
    id: job.id,
    status: job.status,
    text: job.text,
    created_at: job.created_at,
    updated_at: job.updated_at,
  };

  if (job.status === "COMPLETED") {
    response.results = job.results || [];
    response.has_more = job.has_more || false;
  }

  if (job.status === "FAILED") {
    response.error = job.error_message;
  }

  return NextResponse.json(response);
}
