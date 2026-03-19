/**
 * LinkedIn ZIP Data Export Parser
 *
 * Extracts and parses all relevant data from a LinkedIn data export ZIP file.
 * Handles the standard LinkedIn export format with files:
 * - Connections.csv (main contacts — starts after 3 header/note lines)
 * - messages.csv (DM conversations with HTML content)
 * - Invitations.csv (sent/received connection invitations)
 * - Profile.csv (user's own profile)
 * - Positions.csv (user's work history)
 * - Skills.csv (user's skills)
 * - Education.csv (user's education)
 * - Email Addresses.csv (user's emails)
 */

export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  url: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
}

export interface LinkedInMessage {
  conversationId: string;
  from: string;
  senderProfileUrl: string;
  to: string;
  recipientProfileUrls: string;
  date: string;
  content: string;
  folder: string;
}

export interface LinkedInInvitation {
  from: string;
  to: string;
  sentAt: string;
  direction: string;
  inviterProfileUrl: string;
  inviteeProfileUrl: string;
  message: string;
}

export interface LinkedInExportData {
  connections: LinkedInConnection[];
  messages: LinkedInMessage[];
  invitations: LinkedInInvitation[];
  profileName: string | null;
  profileHeadline: string | null;
  profileLocation: string | null;
}

// Robust CSV line parser that handles quoted fields with commas
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(
  text: string,
  skipLines = 0
): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const dataLines = lines.slice(skipLines);
  if (dataLines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(dataLines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim()
  );
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < dataLines.length; i++) {
    const values = parseCsvLine(dataLines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function parseConnectionsCsv(text: string): LinkedInConnection[] {
  // LinkedIn Connections.csv has 3 header/note lines before the actual CSV
  // Line 1: "Notes:"
  // Line 2: Long disclaimer about email addresses
  // Line 3: Empty
  // Line 4: Actual CSV headers: First Name, Last Name, URL, Email Address, Company, Position, Connected On

  // Find the actual header line
  const lines = text.split(/\r?\n/);
  let skipLines = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].startsWith("First Name,")) {
      skipLines = i;
      break;
    }
  }

  const { rows } = parseCsv(
    lines.slice(skipLines).join("\n"),
    0
  );

  return rows
    .map((row) => ({
      firstName: row["First Name"] || "",
      lastName: row["Last Name"] || "",
      url: row["URL"] || "",
      email: row["Email Address"] || "",
      company: row["Company"] || "",
      position: row["Position"] || "",
      connectedOn: row["Connected On"] || "",
    }))
    .filter((c) => c.firstName || c.lastName);
}

export function parseMessagesCsv(text: string): LinkedInMessage[] {
  const { rows } = parseCsv(text);

  return rows
    .map((row) => ({
      conversationId: row["CONVERSATION ID"] || "",
      from: row["FROM"] || "",
      senderProfileUrl: row["SENDER PROFILE URL"] || "",
      to: row["TO"] || "",
      recipientProfileUrls: row["RECIPIENT PROFILE URLS"] || "",
      date: row["DATE"] || "",
      content: stripHtml(row["CONTENT"] || ""),
      folder: row["FOLDER"] || "",
    }))
    .filter((m) => m.from && m.date);
}

export function parseInvitationsCsv(text: string): LinkedInInvitation[] {
  const { rows } = parseCsv(text);

  return rows
    .map((row) => ({
      from: row["From"] || "",
      to: row["To"] || "",
      sentAt: row["Sent At"] || "",
      direction: row["Direction"] || "",
      inviterProfileUrl: row["inviterProfileUrl"] || "",
      inviteeProfileUrl: row["inviteeProfileUrl"] || "",
      message: row["Message"] || "",
    }))
    .filter((inv) => inv.from || inv.to);
}

export function parseProfileCsv(
  text: string
): { name: string; headline: string; location: string } | null {
  const { rows } = parseCsv(text);
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    name:
      `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim(),
    headline: row["Headline"] || "",
    location: row["Geo Location"] || "",
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a message count map: LinkedIn profile URL → number of messages exchanged
 * Used to enrich contacts with interaction frequency
 */
export function buildMessageCountMap(
  messages: LinkedInMessage[],
  ownerProfileUrl: string
): Map<string, { count: number; lastDate: string; lastSnippet: string }> {
  const map = new Map<
    string,
    { count: number; lastDate: string; lastSnippet: string }
  >();

  for (const msg of messages) {
    // Determine the other party's profile URL
    let otherUrl = "";
    if (
      msg.senderProfileUrl &&
      !msg.senderProfileUrl.includes(ownerProfileUrl)
    ) {
      otherUrl = msg.senderProfileUrl;
    } else if (msg.recipientProfileUrls) {
      const urls = msg.recipientProfileUrls.split(",").map((u) => u.trim());
      otherUrl =
        urls.find((u) => u && !u.includes(ownerProfileUrl)) || "";
    }

    if (!otherUrl) continue;

    // Normalize URL
    const normalized = otherUrl
      .replace(/^https?:\/\/(www\.)?linkedin\.com/, "")
      .replace(/\/$/, "");

    const existing = map.get(normalized);
    if (existing) {
      existing.count++;
      if (msg.date > existing.lastDate) {
        existing.lastDate = msg.date;
        existing.lastSnippet = msg.content.slice(0, 200);
      }
    } else {
      map.set(normalized, {
        count: 1,
        lastDate: msg.date,
        lastSnippet: msg.content.slice(0, 200),
      });
    }
  }

  return map;
}
