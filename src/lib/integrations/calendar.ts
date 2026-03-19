export async function fetchCalendarEvents(
  accessToken: string,
  maxResults: number = 100
): Promise<any[]> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("timeMin", oneYearAgo.toISOString());
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("singleEvents", "true");

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
        "SCOPE_ERROR: Your Google account hasn't granted Calendar access. Please sign out and sign back in to grant the required permissions."
      );
    }

    throw new Error(`Calendar API error: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  return data.items || [];
}
