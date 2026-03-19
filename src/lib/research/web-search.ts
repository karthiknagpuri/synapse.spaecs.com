export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface PageContent {
  url: string;
  title: string;
  text: string;
}

/**
 * Search the web for information about a person.
 * Uses Brave Search API if BRAVE_SEARCH_API_KEY is set,
 * otherwise falls back to DuckDuckGo HTML search.
 */
export async function searchWeb(
  query: string,
  count: number = 8
): Promise<WebSearchResult[]> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    return searchBrave(query, count, braveKey);
  }
  return searchDuckDuckGo(query, count);
}

async function searchBrave(
  query: string,
  count: number,
  apiKey: string
): Promise<WebSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: String(count),
    text_decorations: "false",
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    console.error("Brave Search failed:", response.status);
    return [];
  }

  const data = await response.json();
  return (data.web?.results || []).slice(0, count).map(
    (r: { title: string; url: string; description: string }) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
    })
  );
}

async function searchDuckDuckGo(
  query: string,
  count: number
): Promise<WebSearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    });

    const response = await fetch(
      `https://api.duckduckgo.com/?${params}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SynapseResearch/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const results: WebSearchResult[] = [];

    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "",
        snippet: data.Abstract,
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, count - 1)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || "",
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    return results.slice(0, count);
  } catch {
    console.error("DuckDuckGo search failed");
    return [];
  }
}

/**
 * Fetch a web page and extract its text content.
 * Strips HTML tags, scripts, and styles. Limits output to ~5KB.
 */
export async function extractPageContent(
  url: string
): Promise<PageContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, " ").trim()
      : "";

    // Extract meta description
    const metaMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i
    );
    const metaDesc = metaMatch ? metaMatch[1].trim() : "";

    // Strip scripts and styles
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Prepend meta description if available
    if (metaDesc) {
      text = metaDesc + " | " + text;
    }

    return {
      url,
      title,
      text: text.slice(0, 5000),
    };
  } catch {
    return null;
  }
}

/**
 * Search the web and fetch content from top results.
 */
export async function deepWebSearch(
  name: string,
  context?: string
): Promise<{ results: WebSearchResult[]; pages: PageContent[] }> {
  const queries = [
    `${name} ${context || ""}`.trim(),
    `"${name}" professional background`,
    `"${name}" ${context ? context.split(" ").slice(0, 3).join(" ") : "career"}`,
  ];

  // Run all searches in parallel
  const searchPromises = queries.map((q) => searchWeb(q, 5));
  const allResults = await Promise.all(searchPromises);

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueResults: WebSearchResult[] = [];
  for (const results of allResults) {
    for (const r of results) {
      if (!seen.has(r.url) && r.url) {
        seen.add(r.url);
        uniqueResults.push(r);
      }
    }
  }

  // Fetch top pages for content extraction (max 5 concurrent)
  const topUrls = uniqueResults
    .slice(0, 5)
    .filter((r) => !r.url.includes("facebook.com") && !r.url.includes("instagram.com"));

  const pagePromises = topUrls.map((r) => extractPageContent(r.url));
  const pages = (await Promise.all(pagePromises)).filter(
    (p): p is PageContent => p !== null
  );

  return { results: uniqueResults, pages };
}
