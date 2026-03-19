import OpenAI from "openai";

const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

export interface PerplexitySearchResult {
  content: string;
  citations: string[];
}

/**
 * Use Perplexity's sonar model for deep research on a person.
 * Returns a comprehensive text answer with citations.
 */
export async function perplexityResearch(
  name: string,
  context?: string
): Promise<PerplexitySearchResult> {
  const query = context
    ? `${name} — ${context}`
    : name;

  const response = await perplexity.chat.completions.create({
    model: "sonar",
    messages: [
      {
        role: "system",
        content: `You are a professional research analyst. Provide a comprehensive, detailed profile of the person asked about. Include:
- Current role, company, and responsibilities
- Career history and past roles
- Education background
- Notable achievements and accomplishments
- Skills and areas of expertise
- Industry and location
- Social media presence (LinkedIn, Twitter/X, GitHub, personal website URLs)
- Interesting talking points or recent news about them
- Personality insights based on their public presence

Be thorough, factual, and cite your sources. If information is uncertain, say so.`,
      },
      {
        role: "user",
        content: `Research this person thoroughly: ${query}`,
      },
    ],
  });

  const message = response.choices[0].message;
  const content = message.content || "";

  // Perplexity returns citations in the response
  const citations: string[] =
    (response as unknown as { citations?: string[] }).citations || [];

  return { content, citations };
}
