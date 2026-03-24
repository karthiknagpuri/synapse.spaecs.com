import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";
import { checkRateLimit, incrementUsage } from "@/lib/rate-limit";
import { generateEmbedding, translateQuery, generateWhyMatched, rerankResults } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  const { user } = auth;
  const instance = "/api/v1/search";

  // Rate limit check
  const limited = await checkRateLimit(user, "search", instance);
  if (limited) return limited;

  // Parse body
  let body: { text?: string; group_ids?: string[]; include_friends?: boolean };
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

  if (!body.text || typeof body.text !== "string" || !body.text.trim()) {
    return apiError({
      status: 400,
      title: "Bad Request",
      detail: "Field 'text' is required and must be a non-empty string.",
      instance,
    });
  }

  // Create search job (PENDING)
  const { data: job, error: insertError } = await supabaseAdmin
    .from("search_jobs")
    .insert({
      user_id: user.id,
      text: body.text.trim(),
      filters: { group_ids: body.group_ids, include_friends: body.include_friends },
      status: "PENDING",
    })
    .select("id, status, text, created_at")
    .single();

  if (insertError || !job) {
    return apiError({
      status: 500,
      title: "Internal Server Error",
      detail: "Failed to create search job.",
      instance,
    });
  }

  // Increment usage
  await incrementUsage(user.id, "search");

  // Run search pipeline async (fire-and-forget)
  runSearchPipeline(job.id, user.id, body.text.trim()).catch((err) =>
    console.error("[v1/search] Pipeline error:", err)
  );

  return NextResponse.json(
    {
      id: job.id,
      status: "PENDING",
      text: body.text.trim(),
      url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/v1/search/${job.id}`,
      created_at: job.created_at,
    },
    { status: 202 }
  );
}

/**
 * Async search pipeline — runs in the background after the response is sent.
 */
async function runSearchPipeline(jobId: string, userId: string, query: string) {
  try {
    // Mark as processing
    await supabaseAdmin
      .from("search_jobs")
      .update({ status: "PROCESSING", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // Step 1: Translate NL query to structured filters
    const structured = await translateQuery(query);

    // Step 2: Generate query embedding
    const embedding = await generateEmbedding(structured.searchText);

    // Step 3: Vector similarity search (retrieve 30 for re-ranking)
    const { data: results, error } = await supabaseAdmin.rpc("semantic_search", {
      query_embedding: JSON.stringify(embedding),
      match_user_id: userId,
      match_count: 30,
      filter_location: structured.filters.location || null,
      filter_platform: structured.filters.platform || null,
      filter_after: structured.filters.dateAfter || null,
    });

    if (error) throw new Error(`Search RPC failed: ${error.message}`);

    // Step 4: LLM Re-ranking with weighted trait scoring
    const candidates = (results || []).map((r: any) => ({
      contact_id: r.contact_id,
      full_name: r.full_name,
      title: r.title,
      company: r.company,
      location: r.location,
      tags: r.tags,
      bio: r.bio,
      similarity: r.similarity,
    }));

    const ranked = await rerankResults(query, candidates);

    // Step 5: Enrich top 10 re-ranked results with "why matched"
    const enriched = await Promise.all(
      ranked.slice(0, 10).map(async (result) => {
        const whyMatched = await generateWhyMatched(query, {
          full_name: result.full_name,
          company: result.company,
          title: result.title,
          location: result.location,
          tags: result.tags,
          interactions: [],
        });

        // Find the original result for extra fields
        const original = (results || []).find((r: any) => r.contact_id === result.contact_id);

        return {
          id: result.contact_id,
          name: result.full_name,
          current_title: result.title,
          current_company: result.company,
          location: result.location,
          email: original?.email || null,
          summary: whyMatched,
          weighted_traits_score: result.weighted_traits_score,
          confidence: result.confidence,
          trait_scores: result.trait_scores,
          socials: {
            linkedin_url: original?.linkedin_url || null,
            twitter_handle: original?.twitter_handle || null,
          },
        };
      })
    );

    // Mark as completed with results
    await supabaseAdmin
      .from("search_jobs")
      .update({
        status: "COMPLETED",
        results: enriched,
        has_more: (results || []).length > 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err: any) {
    console.error("[v1/search] Pipeline failed:", err);
    await supabaseAdmin
      .from("search_jobs")
      .update({
        status: "FAILED",
        error_message: err.message || "Search pipeline failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
