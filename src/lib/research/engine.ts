import { createClient as createServiceClient } from "@supabase/supabase-js";
import { deepWebSearch } from "./web-search";
import { synthesizeProfile } from "./synthesize";
import { perplexityResearch } from "@/lib/perplexity";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const processingTime = Date.now() - startTime;

    // Step 5: Store results
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
