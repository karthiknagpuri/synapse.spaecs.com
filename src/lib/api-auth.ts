import { createClient as createServiceClient } from "@supabase/supabase-js";
import { apiError } from "./api-error";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ApiUser {
  id: string;
  plan: string;
}

/**
 * Validate a Bearer token from the Authorization header.
 * Returns the authenticated user or an error Response.
 */
export async function authenticateApiKey(
  request: Request
): Promise<{ user: ApiUser } | { error: Response }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: apiError({
        status: 401,
        title: "Unauthorized",
        detail: "Missing or invalid Authorization header. Use: Bearer syn_...",
        instance: new URL(request.url).pathname,
      }),
    };
  }

  const token = authHeader.slice(7).trim();

  if (!token.startsWith("syn_")) {
    return {
      error: apiError({
        status: 401,
        title: "Unauthorized",
        detail: "Invalid API key format. Keys start with syn_",
        instance: new URL(request.url).pathname,
      }),
    };
  }

  // Look up the key
  const { data: keyRecord, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key", token)
    .single();

  if (error || !keyRecord) {
    return {
      error: apiError({
        status: 401,
        title: "Unauthorized",
        detail: "Invalid API key.",
        instance: new URL(request.url).pathname,
      }),
    };
  }

  if (keyRecord.revoked_at) {
    return {
      error: apiError({
        status: 401,
        title: "Unauthorized",
        detail: "This API key has been revoked.",
        instance: new URL(request.url).pathname,
      }),
    };
  }

  // Update last_used_at
  await supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  // Get user profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", keyRecord.user_id)
    .single();

  return {
    user: {
      id: keyRecord.user_id,
      plan: profile?.plan || "free",
    },
  };
}

/** Supabase admin client for v1 API routes (bypasses RLS) */
export { supabaseAdmin };
