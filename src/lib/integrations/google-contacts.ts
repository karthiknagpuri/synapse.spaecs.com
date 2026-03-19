export interface GoogleContact {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  photoUrl: string | null;
}

/**
 * Fetch user's saved Google Contacts via People API.
 * Requires scope: contacts.readonly
 */
export async function fetchGoogleContacts(
  accessToken: string
): Promise<GoogleContact[]> {
  const contacts: GoogleContact[] = [];
  let pageToken = "";

  while (true) {
    const url = new URL(
      "https://people.googleapis.com/v1/people/me/connections"
    );
    url.searchParams.set(
      "personFields",
      "names,emailAddresses,phoneNumbers,organizations,photos"
    );
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("sortOrder", "LAST_MODIFIED_DESCENDING");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("People API connections error:", res.status, body);

      if (res.status === 403) {
        throw new Error(
          "SCOPE_ERROR: Google Contacts permission not granted. Please re-authenticate."
        );
      }
      throw new Error(`People API error: ${res.status}`);
    }

    const data = await res.json();
    const connections = data.connections || [];

    for (const person of connections) {
      const names = person.names || [];
      const emails = person.emailAddresses || [];
      const phones = person.phoneNumbers || [];
      const orgs = person.organizations || [];
      const photos = person.photos || [];

      const displayName =
        names[0]?.displayName || emails[0]?.value?.split("@")[0] || null;

      if (!displayName) continue;

      const email = emails[0]?.value?.toLowerCase() || null;
      const phone = phones[0]?.value || null;
      const company = orgs[0]?.name || null;
      const title = orgs[0]?.title || null;
      const photoUrl =
        photos.find((p: any) => !p.default)?.url || photos[0]?.url || null;

      contacts.push({ name: displayName, email, phone, company, title, photoUrl });
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return contacts;
}
