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
