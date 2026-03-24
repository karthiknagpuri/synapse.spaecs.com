import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, incrementUsage } from "@/lib/rate-limit";
import { runResearchPipeline } from "@/lib/research/engine";

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  const { user } = auth;
  const instance = "/api/v1/research";

  // Rate limit check
  const limited = await checkRateLimit(user, "research", instance);
  if (limited) return limited;

  // Parse body
  let body: { description?: string; contact_id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError({
      status: 400,
      title: "Bad Request",
      detail: "Invalid JSON body.",
      instance,
    });
  }

  if (!body.description || typeof body.description !== "string" || body.description.trim().length < 2) {
    return apiError({
      status: 400,
      title: "Bad Request",
      detail: "Field 'description' is required (min 2 characters). Include name, title, social URLs for best results.",
      instance,
    });
  }

  const description = body.description.trim();

  // Create research profile record
  const { data: research, error: insertError } = await supabaseAdmin
    .from("research_profiles")
    .insert({
      user_id: user.id,
      query_name: description,
      query_context: null,
      contact_id: body.contact_id || null,
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (insertError || !research) {
    return apiError({
      status: 500,
      title: "Internal Server Error",
      detail: "Failed to create research job.",
      instance,
    });
  }

  // Increment usage
  await incrementUsage(user.id, "research");

  // Fire-and-forget pipeline
  runResearchPipeline(
    research.id,
    user.id,
    description,
    undefined,
    body.contact_id
  ).catch((err) => console.error("[v1/research] Pipeline error:", err));

  return NextResponse.json(
    {
      id: research.id,
      status: "PENDING",
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/v1/research/${research.id}`,
      created_at: research.created_at,
    },
    { status: 202 }
  );
}
