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
      const providerToken = data.session.provider_token;
      const providerRefreshToken = data.session.provider_refresh_token;

      console.log("[Auth Callback] provider_token exists:", !!providerToken);
      console.log("[Auth Callback] provider_refresh_token exists:", !!providerRefreshToken);

      // Verify the token has the required scopes
      let grantedScopes: string[] = [];
      let scopesValid = false;

      if (providerToken) {
        try {
          grantedScopes = await verifyTokenScopes(providerToken);
          scopesValid = true;
          console.log("[Auth Callback] Scopes verified:", grantedScopes);
        } catch (err: any) {
          console.warn("[Auth Callback] Scope verification:", err.message);
          // Still save the token - the integration page will handle re-auth
          if (err.name === "ScopeError") {
            grantedScopes = err.grantedScopes;
          }
        }
      }

      if (providerToken) {
        const upsertData: Record<string, any> = {
          user_id: data.session.user.id,
          platform: "google",
          access_token: providerToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
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
