import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { getUsageStats } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  const stats = await getUsageStats(auth.user.id, auth.user.plan);

  return NextResponse.json(stats);
}
