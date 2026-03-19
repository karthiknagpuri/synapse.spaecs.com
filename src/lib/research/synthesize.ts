import OpenAI from "openai";
import type { ResearchProfileData, ResearchSource } from "@/types";
import type { WebSearchResult, PageContent } from "./web-search";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SynthesisInput {
  name: string;
  context?: string;
  contactData?: {
    email?: string | null;
    company?: string | null;
    title?: string | null;
    location?: string | null;
    bio?: string | null;
    linkedin_url?: string | null;
    twitter_handle?: string | null;
    tags?: string[];
    interactions?: {
      type: string;
      subject: string | null;
      snippet: string | null;
      platform: string;
      occurred_at: string;
    }[];
  };
  webResults: WebSearchResult[];
  pageContents: PageContent[];
  perplexityResearch?: string;
  perplexityCitations?: string[];
}

export async function synthesizeProfile(
  input: SynthesisInput
): Promise<{ profile: ResearchProfileData; sources: ResearchSource[] }> {
  // Build the context for the LLM
  const contextParts: string[] = [];

  contextParts.push(`PERSON TO RESEARCH: ${input.name}`);
  if (input.context) {
    contextParts.push(`ADDITIONAL CONTEXT: ${input.context}`);
  }

  // Add Perplexity research as PRIMARY source (most comprehensive)
  if (input.perplexityResearch) {
    contextParts.push(
      `AI-POWERED DEEP RESEARCH (PRIMARY SOURCE — this is the most comprehensive and reliable data):\n${input.perplexityResearch}`
    );
  }

  // Add existing contact data
  if (input.contactData) {
    const cd = input.contactData;
    const contactInfo = [
      cd.email && `Email: ${cd.email}`,
      cd.company && `Company: ${cd.company}`,
      cd.title && `Title: ${cd.title}`,
      cd.location && `Location: ${cd.location}`,
      cd.bio && `Bio: ${cd.bio}`,
      cd.linkedin_url && `LinkedIn: ${cd.linkedin_url}`,
      cd.twitter_handle && `Twitter: @${cd.twitter_handle}`,
      cd.tags?.length && `Tags: ${cd.tags.join(", ")}`,
    ].filter(Boolean);

    if (contactInfo.length > 0) {
      contextParts.push(
        `KNOWN CONTACT DATA:\n${contactInfo.join("\n")}`
      );
    }

    // Add interaction history
    if (cd.interactions && cd.interactions.length > 0) {
      const interactionSummary = cd.interactions
        .slice(0, 15)
        .map(
          (i) =>
            `- ${i.type} via ${i.platform} on ${new Date(i.occurred_at).toLocaleDateString()}${i.subject ? `: "${i.subject}"` : ""}${i.snippet ? ` — ${i.snippet.slice(0, 100)}` : ""}`
        )
        .join("\n");
      contextParts.push(
        `INTERACTION HISTORY:\n${interactionSummary}`
      );
    }
  }

  // Add web search results (supplementary to Perplexity)
  if (input.webResults.length > 0) {
    const webSummary = input.webResults
      .slice(0, 10)
      .map((r) => `- [${r.title}](${r.url}): ${r.snippet}`)
      .join("\n");
    contextParts.push(
      `WEB SEARCH RESULTS:\n${webSummary}`
    );
  }

  // Add scraped page content
  if (input.pageContents.length > 0) {
    for (const page of input.pageContents.slice(0, 5)) {
      contextParts.push(
        `PAGE CONTENT FROM ${page.url} (${page.title}):\n${page.text.slice(0, 3000)}`
      );
    }
  }

  const systemPrompt = `You are a world-class professional research analyst. Your task is to build a comprehensive, detailed profile of a person based on all available information.

You must return a JSON object with EXACTLY this structure:
{
  "summary": "A 3-5 sentence executive summary of who this person is, what they do, and what makes them notable",
  "current_role": {
    "title": "Their current job title",
    "company": "Their current company",
    "description": "2-3 sentences about what they do in this role"
  },
  "career_history": [
    {
      "title": "Job title",
      "company": "Company name",
      "period": "Start - End (e.g., 2020 - Present)",
      "description": "Brief description of the role"
    }
  ],
  "education": [
    {
      "institution": "University name",
      "degree": "Degree type",
      "field": "Field of study",
      "year": "Graduation year or period"
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "interests": ["interest1", "interest2", ...],
  "notable_achievements": ["achievement1", "achievement2", ...],
  "social_presence": {
    "linkedin": "LinkedIn URL or null",
    "twitter": "Twitter handle or null",
    "github": "GitHub URL or null",
    "website": "Personal website URL or null"
  },
  "talking_points": [
    "Specific conversation starters or topics you could discuss with this person"
  ],
  "personality_insights": "2-3 sentences about their communication style, values, or personality based on available data",
  "industry": "Their primary industry",
  "location": "Their location or null"
}

RULES:
- Be thorough but accurate. Only include information you're confident about.
- If you don't have information for a field, use null for objects, empty arrays for lists, or empty strings for text.
- For career_history, list roles in reverse chronological order (most recent first).
- For talking_points, generate 3-5 specific, actionable conversation topics based on their background.
- For personality_insights, infer from their career choices, interests, and communication patterns.
- Include AT LEAST 5 skills and 3 interests if possible.
- Make the summary engaging and informative.
- current_role should be null if you cannot determine their current position.
- Do NOT fabricate specific details like exact dates or titles if you're not sure. Use approximate language.
- Prioritize the AI-powered deep research data when available — it is the most reliable source.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: contextParts.join("\n\n---\n\n"),
      },
    ],
  });

  const content = response.choices[0].message.content || "{}";
  const profile = JSON.parse(content) as ResearchProfileData;

  // Build sources — combine Perplexity citations + web results
  const sources: ResearchSource[] = [];

  // Add Perplexity citations first (higher quality)
  if (input.perplexityCitations) {
    for (const url of input.perplexityCitations) {
      if (url && !sources.some((s) => s.url === url)) {
        // Try to find a matching web result for title/snippet
        const match = input.webResults.find((r) => r.url === url);
        sources.push({
          url,
          title: match?.title || new URL(url).hostname,
          snippet: match?.snippet?.slice(0, 200) || "",
        });
      }
    }
  }

  // Add remaining web results
  for (const r of input.webResults) {
    if (r.url && r.title && !sources.some((s) => s.url === r.url)) {
      sources.push({
        url: r.url,
        title: r.title,
        snippet: r.snippet.slice(0, 200),
      });
    }
    if (sources.length >= 15) break;
  }

  return { profile, sources };
}
