import { createClient as createServiceClient } from "@supabase/supabase-js";
import { deepWebSearch } from "./web-search";
import { synthesizeProfile } from "./synthesize";
import { perplexityResearch } from "@/lib/perplexity";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Find connection paths to a person through the user's network and friends.
 * Returns intro paths like: You → Friend → Target Person
 */
async function findConnectionPaths(
  userId: string,
  name: string,
  email: string | null
): Promise<{ type: string; via?: string; via_user_id?: string; contact_id: string; relationship_score: number }[]> {
  const paths: { type: string; via?: string; via_user_id?: string; contact_id: string; relationship_score: number }[] = [];

  try {
    // Direct connection — in user's own contacts
    const directQuery = supabaseAdmin
      .from("contacts")
      .select("id, full_name, relationship_score")
      .eq("user_id", userId);

    if (email) {
      directQuery.or(`full_name.ilike.%${name}%,email.eq.${email}`);
    } else {
      directQuery.ilike("full_name", `%${name}%`);
    }

    const { data: directMatches } = await directQuery.limit(3);

    if (directMatches && directMatches.length > 0) {
      for (const m of directMatches) {
        paths.push({
          type: "direct",
          contact_id: m.id,
          relationship_score: m.relationship_score || 0,
        });
      }
    }

    // Friend connections — search friends' contacts
    const { data: friendships } = await supabaseAdmin
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map((f) => f.friend_id);

      for (const friendId of friendIds.slice(0, 10)) {
        const friendQuery = supabaseAdmin
          .from("contacts")
          .select("id, full_name, relationship_score")
          .eq("user_id", friendId);

        if (email) {
          friendQuery.or(`full_name.ilike.%${name}%,email.eq.${email}`);
        } else {
          friendQuery.ilike("full_name", `%${name}%`);
        }

        const { data: friendMatches } = await friendQuery.limit(1);

        if (friendMatches && friendMatches.length > 0) {
          // Get friend's name
          const { data: friendProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", friendId)
            .single();

          paths.push({
            type: "friend",
            via: friendProfile?.full_name || "A friend",
            via_user_id: friendId,
            contact_id: friendMatches[0].id,
            relationship_score: friendMatches[0].relationship_score || 0,
          });
        }
      }
    }
  } catch (err) {
    console.error("[Research] Connection path finding error:", err);
  }

  return paths;
}

/**
 * Run the full research pipeline for a person.
 * Uses Perplexity AI as primary research source when available,
 * with web search as supplementary/fallback.
 */
export async function runResearchPipeline(
  researchId: string,
  userId: string,
  name: string,
  context?: string,
  contactId?: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // Update status to researching
    await supabaseAdmin
      .from("research_profiles")
      .update({ status: "researching" })
      .eq("id", researchId);

    // Step 1: Gather existing contact data from Supabase
    let contactData = null;
    if (contactId) {
      const { data: contact } = await supabaseAdmin
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (contact) {
        const { data: interactions } = await supabaseAdmin
          .from("interactions")
          .select("type, subject, snippet, platform, occurred_at")
          .eq("contact_id", contactId)
          .order("occurred_at", { ascending: false })
          .limit(20);

        contactData = {
          email: contact.email,
          company: contact.company,
          title: contact.title,
          location: contact.location,
          bio: contact.bio,
          linkedin_url: contact.linkedin_url,
          twitter_handle: contact.twitter_handle,
          tags: contact.tags,
          interactions: interactions || [],
        };
      }
    } else {
      // Try to find a matching contact by name
      const { data: contacts } = await supabaseAdmin
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .ilike("full_name", `%${name}%`)
        .limit(1);

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const { data: interactions } = await supabaseAdmin
          .from("interactions")
          .select("type, subject, snippet, platform, occurred_at")
          .eq("contact_id", contact.id)
          .order("occurred_at", { ascending: false })
          .limit(20);

        contactData = {
          email: contact.email,
          company: contact.company,
          title: contact.title,
          location: contact.location,
          bio: contact.bio,
          linkedin_url: contact.linkedin_url,
          twitter_handle: contact.twitter_handle,
          tags: contact.tags,
          interactions: interactions || [],
        };

        // Link research to found contact
        if (!contactId) {
          await supabaseAdmin
            .from("research_profiles")
            .update({ contact_id: contact.id })
            .eq("id", researchId);
        }
      }
    }

    // Step 2: Build search context
    const searchContext = [
      context,
      contactData?.company,
      contactData?.title,
    ]
      .filter(Boolean)
      .join(" ");

    // Step 3: Run Perplexity + web search in parallel
    const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;

    let perplexityContent = "";
    let perplexityCitations: string[] = [];

    const [perplexityResult, webSearchResult] = await Promise.allSettled([
      hasPerplexity
        ? perplexityResearch(name, searchContext || undefined)
        : Promise.resolve(null),
      deepWebSearch(name, searchContext || undefined),
    ]);

    // Extract Perplexity results
    if (
      perplexityResult.status === "fulfilled" &&
      perplexityResult.value
    ) {
      perplexityContent = perplexityResult.value.content;
      perplexityCitations = perplexityResult.value.citations;
    }

    // Extract web search results (always runs as supplementary)
    let webResults: Awaited<ReturnType<typeof deepWebSearch>>["results"] = [];
    let pageContents: Awaited<ReturnType<typeof deepWebSearch>>["pages"] = [];

    if (webSearchResult.status === "fulfilled") {
      webResults = webSearchResult.value.results;
      pageContents = webSearchResult.value.pages;
    }

    // Step 4: Synthesize with LLM — include Perplexity research as primary context
    const { profile, sources } = await synthesizeProfile({
      name,
      context,
      contactData: contactData || undefined,
      webResults,
      pageContents,
      perplexityResearch: perplexityContent || undefined,
      perplexityCitations: perplexityCitations.length > 0 ? perplexityCitations : undefined,
    });

    // Step 5: Find connection paths — does this person exist in the user's network?
    const connectionPaths = await findConnectionPaths(userId, name, contactData?.email || null);

    // Merge connection info into profile
    if (connectionPaths.length > 0) {
      (profile as any).connection_paths = connectionPaths;
    }

    const processingTime = Date.now() - startTime;

    // Step 6: Store results
    await supabaseAdmin
      .from("research_profiles")
      .update({
        status: "completed",
        profile_data: profile,
        sources,
        processing_time_ms: processingTime,
      })
      .eq("id", researchId);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Research pipeline failed:", errorMessage);

    await supabaseAdmin
      .from("research_profiles")
      .update({
        status: "failed",
        error_message: errorMessage,
        processing_time_ms: processingTime,
      })
      .eq("id", researchId);
  }
}
