export interface LinkedInContact {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
  url: string;
}

export function parseLinkedInCSV(csvText: string): LinkedInContact[] {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const contacts: LinkedInContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    contacts.push({
      firstName: row["First Name"] || "",
      lastName: row["Last Name"] || "",
      email: row["Email Address"] || "",
      company: row["Company"] || "",
      position: row["Position"] || "",
      connectedOn: row["Connected On"] || "",
      url: row["URL"] || "",
    });
  }

  return contacts.filter((c) => c.firstName || c.lastName);
}
