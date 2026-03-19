/**
 * Fetch profile photos from Google People API "Other Contacts"
 * (auto-created contacts from Gmail interactions).
 * Requires scope: contacts.other.readonly
 */
export async function fetchGoogleProfilePhotos(
  accessToken: string
): Promise<Map<string, string>> {
  const photoMap = new Map<string, string>();
  let pageToken = "";

  // Fetch Other Contacts (people from Gmail interactions)
  while (true) {
    const url = new URL(
      "https://people.googleapis.com/v1/otherContacts"
    );
    url.searchParams.set("readMask", "emailAddresses,photos");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("People API error:", res.status, body);

      // If scope error, fail silently - photos are optional
      if (res.status === 403) {
        console.warn("People API: contacts.other.readonly scope not granted, skipping photo fetch");
        return photoMap;
      }
      break;
    }

    const data = await res.json();
    const contacts = data.otherContacts || [];

    for (const person of contacts) {
      const emails = person.emailAddresses || [];
      const photos = person.photos || [];
      const photo = photos.find((p: any) => !p.default)?.url || photos[0]?.url;

      if (photo) {
        for (const emailObj of emails) {
          const email = emailObj.value?.toLowerCase();
          if (email) {
            photoMap.set(email, photo);
          }
        }
      }
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  // Also fetch user's saved contacts
  pageToken = "";
  while (true) {
    const url = new URL(
      "https://people.googleapis.com/v1/people/me/connections"
    );
    url.searchParams.set("personFields", "emailAddresses,photos");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      // Fail silently - saved contacts scope might not be granted
      break;
    }

    const data = await res.json();
    const connections = data.connections || [];

    for (const person of connections) {
      const emails = person.emailAddresses || [];
      const photos = person.photos || [];
      const photo = photos.find((p: any) => !p.default)?.url || photos[0]?.url;

      if (photo) {
        for (const emailObj of emails) {
          const email = emailObj.value?.toLowerCase();
          if (email && !photoMap.has(email)) {
            photoMap.set(email, photo);
          }
        }
      }
    }

    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return photoMap;
}
