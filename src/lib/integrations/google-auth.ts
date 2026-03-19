const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export class ScopeError extends Error {
  constructor(
    public missingScopes: string[],
    public grantedScopes: string[]
  ) {
    super(
      `Missing required scopes: ${missingScopes.join(", ")}. User must re-authenticate with proper permissions.`
    );
    this.name = "ScopeError";
  }
}

/**
 * Verify a Google access token has the required scopes by calling tokeninfo.
 * Returns the granted scopes array.
 * Throws ScopeError if required scopes are missing.
 */
export async function verifyTokenScopes(
  accessToken: string,
  requiredScopes?: string[]
): Promise<string[]> {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
  );

  if (!res.ok) {
    throw new Error(`Token verification failed: ${res.status}`);
  }

  const data = await res.json();
  const grantedScopes = (data.scope || "").split(" ").filter(Boolean);
  const scopesToCheck = requiredScopes || REQUIRED_SCOPES;

  const missing = scopesToCheck.filter(
    (scope) => !grantedScopes.includes(scope)
  );

  if (missing.length > 0) {
    throw new ScopeError(missing, grantedScopes);
  }

  return grantedScopes;
}

/**
 * Refresh a Google access token using a refresh token.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables"
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Token refresh error:", error);
    throw new Error(`Token refresh failed: ${res.status} - ${error}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Refresh token and verify it has the required scopes.
 * Returns the new access token if scopes are valid.
 * Throws ScopeError if the refresh token doesn't grant required scopes.
 */
export async function refreshAndVerifyToken(
  refreshToken: string,
  requiredScopes?: string[]
): Promise<string> {
  const accessToken = await refreshGoogleAccessToken(refreshToken);
  await verifyTokenScopes(accessToken, requiredScopes);
  return accessToken;
}
