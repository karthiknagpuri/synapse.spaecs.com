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

    const body = await request.json();
    const { query, include_friends, group_ids } = body as {
      query: string;
      include_friends?: boolean;
      group_ids?: string[];
    };

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

    // Step 3: Build user ID list for network search
    const userIds = [user.id];

    if (include_friends) {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", user.id);
      if (friendships) {
        userIds.push(...friendships.map((f) => f.friend_id));
      }
    }

    if (group_ids && group_ids.length > 0) {
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", group_ids);
      if (members) {
        for (const m of members) {
          if (!userIds.includes(m.user_id)) {
            userIds.push(m.user_id);
          }
        }
      }
    }

    // Step 4: Search across network
    const isNetworkSearch = userIds.length > 1;

    let results: any[] = [];

    if (isNetworkSearch) {
      const { data, error } = await supabase.rpc("network_semantic_search", {
        query_embedding: JSON.stringify(embedding),
        match_user_ids: userIds,
        match_count: 30,
        filter_location: structured.filters.location || null,
        filter_platform: structured.filters.platform || null,
        filter_after: structured.filters.dateAfter || null,
      });

      if (error) {
        console.error("Network search RPC error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }
      results = data || [];
    } else {
      const { data, error } = await supabase.rpc("semantic_search", {
        query_embedding: JSON.stringify(embedding),
        match_user_id: user.id,
        match_count: 30,
        filter_location: structured.filters.location || null,
        filter_platform: structured.filters.platform || null,
        filter_after: structured.filters.dateAfter || null,
      });

      if (error) {
        console.error("Search RPC error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }
      results = data || [];
    }

    // Step 5: LLM Re-ranking
    const candidates = results.map((r: any) => ({
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
      owner_user_id: r.owner_user_id,
    }));

    const ranked = await rerankResults(query, candidates);

    // Step 6: Generate "Why matched" for top 10
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

        const entry: any = {
          ...result,
          why_matched: whyMatched,
        };

        // For network results, indicate who knows this contact
        if (isNetworkSearch && (result as any).owner_user_id && (result as any).owner_user_id !== user.id) {
          entry.connected_through = (result as any).owner_user_id;
        }

        return entry;
      })
    );

    return NextResponse.json({
      results: enrichedResults,
      structured_query: structured,
      total: enrichedResults.length,
      network_search: isNetworkSearch,
      users_searched: userIds.length,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
