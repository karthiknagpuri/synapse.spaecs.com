import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTokenScopes } from "@/lib/integrations/google-auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      // Ensure user profile exists (upsert on every login)
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          email: user.email || "",
        },
        { onConflict: "id" }
      );

      // Verify the token has the required scopes
      let grantedScopes: string[] = [];
      let scopesValid = false;

      if (providerToken) {
        try {
          grantedScopes = await verifyTokenScopes(providerToken);
          scopesValid = true;
        } catch (err: any) {
          console.warn("[Auth Callback] Scope verification:", err.message);
          if (err.name === "ScopeError") {
            grantedScopes = err.grantedScopes;
          }
        }
      }

      if (providerToken) {
        // Use actual token expiry from session (falls back to 1hr)
        const expiresIn = data.session.expires_in || 3600;
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const upsertData: Record<string, any> = {
          user_id: user.id,
          platform: "google",
          access_token: providerToken,
          token_expires_at: tokenExpiresAt,
          scopes: grantedScopes,
          status: scopesValid ? "active" : "needs_reauth",
        };

        if (providerRefreshToken) {
          upsertData.refresh_token = providerRefreshToken;
        }

        await supabase.from("integrations").upsert(upsertData, {
          onConflict: "user_id,platform",
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
