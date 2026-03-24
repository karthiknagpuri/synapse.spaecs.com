import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function translateQuery(
  naturalLanguageQuery: string
): Promise<{
  searchText: string;
  filters: {
    location?: string;
    platform?: string;
    dateAfter?: string;
    dateBefore?: string;
    tags?: string[];
  };
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a search query translator. Convert natural language queries about a user's professional network into structured search parameters.

Return JSON with:
- searchText: the core semantic search terms (what to embed and search for)
- filters: optional SQL filters
  - location: city/region if mentioned
  - platform: "gmail" | "calendar" | "linkedin" if a specific source is mentioned
  - dateAfter: ISO date string if time mentioned (e.g., "last year" = start of last year)
  - dateBefore: ISO date string if time range end mentioned
  - tags: array of tags if specific roles/categories mentioned

Examples:
"Founders in Hyderabad I emailed about Web3 last year" →
{ "searchText": "Web3 founder startup blockchain", "filters": { "location": "Hyderabad", "platform": "gmail", "dateAfter": "2025-01-01", "dateBefore": "2025-12-31" } }

"designers I met at conferences" →
{ "searchText": "designer UX UI design conference event", "filters": { "platform": "calendar" } }

"people at Google" →
{ "searchText": "Google engineer product manager", "filters": {} }

Current date: ${new Date().toISOString().split("T")[0]}`,
      },
      { role: "user", content: naturalLanguageQuery },
    ],
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateWhyMatched(
  query: string,
  contact: {
    full_name: string;
    company?: string | null;
    title?: string | null;
    location?: string | null;
    tags?: string[];
    interactions?: { type: string; subject: string | null; occurred_at: string }[];
  }
): Promise<string> {
  const interactionSummary = contact.interactions
    ?.slice(0, 3)
    .map(
      (i) =>
        `${i.type} ${i.subject ? `about "${i.subject}"` : ""} on ${new Date(i.occurred_at).toLocaleDateString()}`
    )
    .join("; ");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content:
          "Generate a brief 1-2 sentence explanation of why this contact matched the search query. Be specific and reference actual data points. Start with 'Matched:'",
      },
      {
        role: "user",
        content: `Query: "${query}"
Contact: ${contact.full_name}, ${contact.title || "N/A"} at ${contact.company || "N/A"}, ${contact.location || "N/A"}
Tags: ${contact.tags?.join(", ") || "none"}
Recent interactions: ${interactionSummary || "none"}`,
      },
    ],
  });

  return response.choices[0].message.content || "Matched based on relevance.";
}

/* ─── LLM Re-Ranking ─── */

interface SearchCandidate {
  contact_id: string;
  full_name: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  tags?: string[];
  bio?: string | null;
  similarity: number;
}

export interface RankedResult extends SearchCandidate {
  weighted_traits_score: number;
  trait_scores: {
    role_match: number;
    company_match: number;
    location_match: number;
    seniority_match: number;
    overall_relevance: number;
  };
  confidence: "strong" | "possible" | "weak";
}

/**
 * Re-rank vector search results using LLM-based scoring.
 * Takes raw vector similarity results and applies semantic scoring
 * on each trait (role, company, location, seniority, relevance).
 * Returns sorted results with weighted_traits_score (0-3 scale).
 */
export async function rerankResults(
  query: string,
  candidates: SearchCandidate[]
): Promise<RankedResult[]> {
  if (candidates.length === 0) return [];

  // Build compact candidate list for the LLM
  const candidateList = candidates.map((c, i) => ({
    idx: i,
    name: c.full_name,
    title: c.title || "",
    company: c.company || "",
    location: c.location || "",
    tags: (c.tags || []).join(", "),
    bio: (c.bio || "").slice(0, 120),
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a search result re-ranker for a professional network search engine.

Given a search query and a list of candidate contacts, score each candidate on how well they match the query.

For each candidate, return scores from 0.0 to 1.0 for these traits:
- role_match: How well their title/role matches what's being searched for
- company_match: How well their company matches (industry, specific company, stage)
- location_match: How well their location matches (1.0 if location matches or wasn't specified)
- seniority_match: How well their seniority level matches the query intent
- overall_relevance: Overall semantic fit considering all factors

Return JSON: { "scores": [ { "idx": 0, "role_match": 0.8, "company_match": 0.5, "location_match": 1.0, "seniority_match": 0.7, "overall_relevance": 0.75 }, ... ] }

Score honestly. If a candidate is clearly not relevant, give low scores. Don't inflate.`,
      },
      {
        role: "user",
        content: `Query: "${query}"\n\nCandidates:\n${JSON.stringify(candidateList)}`,
      },
    ],
  });

  let scores: {
    idx: number;
    role_match: number;
    company_match: number;
    location_match: number;
    seniority_match: number;
    overall_relevance: number;
  }[];

  try {
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    scores = parsed.scores || [];
  } catch {
    // Fallback: use vector similarity as score
    return candidates.map((c) => ({
      ...c,
      weighted_traits_score: Math.round(c.similarity * 300) / 100,
      trait_scores: {
        role_match: c.similarity,
        company_match: c.similarity,
        location_match: c.similarity,
        seniority_match: c.similarity,
        overall_relevance: c.similarity,
      },
      confidence: c.similarity > 0.7 ? "strong" as const : c.similarity > 0.4 ? "possible" as const : "weak" as const,
    }));
  }

  // Merge scores with candidates
  const scoreMap = new Map(scores.map((s) => [s.idx, s]));

  const ranked: RankedResult[] = candidates.map((c, i) => {
    const s = scoreMap.get(i) || {
      role_match: 0,
      company_match: 0,
      location_match: 0,
      seniority_match: 0,
      overall_relevance: 0,
    };

    // Weighted composite: role 30%, company 20%, location 15%, seniority 10%, overall 25%
    const weighted =
      s.role_match * 0.3 +
      s.company_match * 0.2 +
      s.location_match * 0.15 +
      s.seniority_match * 0.1 +
      s.overall_relevance * 0.25;

    // Scale to 0-3 range (matches Happenstance's scoring)
    const weightedTraitsScore = Math.round(weighted * 300) / 100;

    const confidence: "strong" | "possible" | "weak" =
      weightedTraitsScore >= 2.0
        ? "strong"
        : weightedTraitsScore >= 1.0
        ? "possible"
        : "weak";

    return {
      ...c,
      weighted_traits_score: weightedTraitsScore,
      trait_scores: {
        role_match: s.role_match,
        company_match: s.company_match,
        location_match: s.location_match,
        seniority_match: s.seniority_match,
        overall_relevance: s.overall_relevance,
      },
      confidence,
    };
  });

  // Sort by weighted score descending
  ranked.sort((a, b) => b.weighted_traits_score - a.weighted_traits_score);

  return ranked;
}

/* ─── Embedding Text ─── */

export function generateContactEmbeddingText(contact: {
  full_name: string;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  bio?: string | null;
  tags?: string[];
  interactions?: { subject?: string | null; snippet?: string | null }[];
}): string {
  const parts = [
    contact.full_name,
    contact.title,
    contact.company,
    contact.location,
    contact.bio,
    contact.tags?.join(", "),
    contact.interactions
      ?.slice(0, 10)
      .map((i) => [i.subject, i.snippet].filter(Boolean).join(" "))
      .join(". "),
  ].filter(Boolean);

  return parts.join(" | ");
}
