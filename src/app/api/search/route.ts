import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, translateQuery, generateWhyMatched, rerankResults } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Step 1: Translate natural language to structured query
    const structured = await translateQuery(query);

    // Step 2: Generate embedding for search text
    const embedding = await generateEmbedding(structured.searchText);

    // Step 3: Call Supabase RPC for hybrid search (retrieve more for re-ranking)
    const { data: results, error } = await supabase.rpc("semantic_search", {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user.id,
      match_count: 30,
      filter_location: structured.filters.location || null,
      filter_platform: structured.filters.platform || null,
      filter_after: structured.filters.dateAfter || null,
    });

    if (error) {
      console.error("Search RPC error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

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
      // Pass through extra fields
      email: r.email,
      avatar_url: r.avatar_url,
      linkedin_url: r.linkedin_url,
      twitter_handle: r.twitter_handle,
      relationship_score: r.relationship_score,
      source: r.source,
    }));

    const ranked = await rerankResults(query, candidates);

    // Step 5: Generate "Why matched" for top 10 re-ranked results
    const enrichedResults = await Promise.all(
      ranked.slice(0, 10).map(async (result) => {
        const { data: interactions } = await supabase
          .from("interactions")
          .select("type, subject, occurred_at")
          .eq("contact_id", result.contact_id)
          .order("occurred_at", { ascending: false })
          .limit(3);

        const whyMatched = await generateWhyMatched(query, {
          full_name: result.full_name,
          company: result.company,
          title: result.title,
          location: result.location,
          tags: result.tags,
          interactions: interactions || [],
        });

        return {
          ...result,
          why_matched: whyMatched,
        };
      })
    );

    return NextResponse.json({
      results: enrichedResults,
      structured_query: structured,
      total: enrichedResults.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
