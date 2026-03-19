import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, translateQuery, generateWhyMatched } from "@/lib/openai";

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

    // Step 3: Call Supabase RPC for hybrid search
    const { data: results, error } = await supabase.rpc("semantic_search", {
      query_embedding: JSON.stringify(embedding),
      match_user_id: user.id,
      match_count: 20,
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

    // Step 4: Generate "Why matched" for top results
    const enrichedResults = await Promise.all(
      (results || []).slice(0, 10).map(async (result: any) => {
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

        // Determine which fields contributed to match
        const matchedFields: string[] = [];
        if (structured.filters.location && result.location) matchedFields.push("location");
        if (structured.filters.platform) matchedFields.push("platform");
        if (structured.filters.tags?.length) matchedFields.push("tags");
        if (result.title) matchedFields.push("title");
        if (result.company) matchedFields.push("company");

        return {
          ...result,
          why_matched: whyMatched,
          matched_fields: matchedFields,
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
