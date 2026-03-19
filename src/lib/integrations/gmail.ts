export interface GmailThread {
  id: string;
  messages: {
    from: string;
    to: string[];
    subject: string;
    snippet: string;
    date: string;
  }[];
}

export function parseEmailAddress(
  header: string
): { name: string; email: string } | null {
  const match = header.match(/^"?(.+?)"?\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].toLowerCase() };

  const emailMatch = header.match(/([^\s<>]+@[^\s<>]+)/);
  if (emailMatch)
    return { name: "", email: emailMatch[1].toLowerCase() };

  return null;
}

export function extractHeader(
  headers: { name: string; value: string }[],
  name: string
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export async function fetchGmailThreads(
  accessToken: string,
  maxResults: number = 200
): Promise<any[]> {
  const threads: any[] = [];
  let pageToken = "";

  while (threads.length < maxResults) {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
    url.searchParams.set("maxResults", String(Math.min(100, maxResults - threads.length)));
    url.searchParams.set("labelIds", "SENT");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let parsed: any = {};
      try { parsed = JSON.parse(errorBody); } catch {}

      const reason = parsed?.error?.details?.[0]?.reason;
      if (res.status === 403 && reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT") {
        throw new Error(
          "SCOPE_ERROR: Your Google account hasn't granted Gmail access. Please sign out and sign back in to grant the required permissions."
        );
      }

      throw new Error(`Gmail API error: ${res.status} - ${errorBody}`);
    }

    const data = await res.json();
    if (!data.threads) break;

    threads.push(...data.threads);
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return threads;
}

export async function fetchThreadDetail(
  accessToken: string,
  threadId: string
): Promise<any> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Gmail thread fetch error: ${res.status}`);
  return res.json();
}
