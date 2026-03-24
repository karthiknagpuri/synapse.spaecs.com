import { supabaseAdmin, type ApiUser } from "./api-auth";
import { apiError } from "./api-error";

const LIMITS: Record<string, { search: number; research: number }> = {
  free: { search: 15, research: 5 },
  pro: { search: -1, research: -1 }, // -1 = unlimited
};

interface UsageRecord {
  monthly_search_count: number;
  monthly_research_count: number;
  usage_reset_at: string | null;
}

async function getUsage(userId: string): Promise<UsageRecord> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("monthly_search_count, monthly_research_count, usage_reset_at")
    .eq("id", userId)
    .single();

  const record: UsageRecord = {
    monthly_search_count: data?.monthly_search_count || 0,
    monthly_research_count: data?.monthly_research_count || 0,
    usage_reset_at: data?.usage_reset_at || null,
  };

  // Reset if we're in a new month
  const resetAt = record.usage_reset_at
    ? new Date(record.usage_reset_at)
    : null;
  const now = new Date();

  if (
    !resetAt ||
    resetAt.getUTCMonth() !== now.getUTCMonth() ||
    resetAt.getUTCFullYear() !== now.getUTCFullYear()
  ) {
    await supabaseAdmin
      .from("profiles")
      .update({
        monthly_search_count: 0,
        monthly_research_count: 0,
        usage_reset_at: now.toISOString(),
      })
      .eq("id", userId);

    record.monthly_search_count = 0;
    record.monthly_research_count = 0;
    record.usage_reset_at = now.toISOString();
  }

  return record;
}

/**
 * Check rate limit for a given operation. Returns null if allowed,
 * or an error Response if limit exceeded.
 */
export async function checkRateLimit(
  user: ApiUser,
  operation: "search" | "research",
  instance: string
): Promise<Response | null> {
  const limits = LIMITS[user.plan] || LIMITS.free;
  const limit = operation === "search" ? limits.search : limits.research;

  // -1 = unlimited
  if (limit === -1) return null;

  const usage = await getUsage(user.id);
  const current =
    operation === "search"
      ? usage.monthly_search_count
      : usage.monthly_research_count;

  if (current >= limit) {
    return apiError({
      status: 429,
      title: "Rate Limit Exceeded",
      detail: `${current}/${limit} ${operation} requests used this month. Upgrade to Pro for unlimited.`,
      instance,
    });
  }

  return null;
}

/**
 * Increment usage counter after a successful operation.
 */
export async function incrementUsage(
  userId: string,
  operation: "search" | "research"
) {
  // Ensure usage is current (resets if new month)
  await getUsage(userId);

  const field =
    operation === "search"
      ? "monthly_search_count"
      : "monthly_research_count";

  // Use RPC or raw increment
  const { data } = await supabaseAdmin
    .from("profiles")
    .select(field)
    .eq("id", userId)
    .single();

  const current = (data as Record<string, number>)?.[field] || 0;

  await supabaseAdmin
    .from("profiles")
    .update({ [field]: current + 1 })
    .eq("id", userId);
}

/**
 * Get current usage stats for a user.
 */
export async function getUsageStats(userId: string, plan: string) {
  const usage = await getUsage(userId);
  const limits = LIMITS[plan] || LIMITS.free;

  return {
    search: {
      used: usage.monthly_search_count,
      limit: limits.search === -1 ? "unlimited" : limits.search,
    },
    research: {
      used: usage.monthly_research_count,
      limit: limits.research === -1 ? "unlimited" : limits.research,
    },
    resets_at: getNextMonthReset(),
    plan,
  };
}

function getNextMonthReset(): string {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return next.toISOString();
}
