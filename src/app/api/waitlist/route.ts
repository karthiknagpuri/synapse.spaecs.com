import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX = 5;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

export async function GET() {
  const { count, error } = await supabaseAdmin
    .from("waitlist_guesses")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: "count_failed" }, { status: 500 });
  }
  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { name, email, guess, hp } = (body ?? {}) as {
    name?: string;
    email?: string;
    guess?: number;
    hp?: string;
  };

  if (hp && hp.trim() !== "") {
    return NextResponse.json({ success: true, count: 0 });
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanGuess = typeof guess === "number" ? Math.round(guess) : NaN;

  if (cleanName.length < 1 || cleanName.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!Number.isFinite(cleanGuess) || cleanGuess < 0 || cleanGuess > 1_000_000) {
    return NextResponse.json({ error: "invalid_guess" }, { status: 400 });
  }

  const ip_hash = hashIp(req);
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count: recent, error: rateErr } = await supabaseAdmin
    .from("waitlist_guesses")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);

  if (rateErr) {
    return NextResponse.json({ error: "rate_check_failed" }, { status: 500 });
  }
  if ((recent ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const user_agent = (req.headers.get("user-agent") || "").slice(0, 300);

  const { error: upsertErr } = await supabaseAdmin
    .from("waitlist_guesses")
    .upsert(
      {
        email: cleanEmail,
        name: cleanName,
        guess: cleanGuess,
        ip_hash,
        user_agent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (upsertErr) {
    console.error("[waitlist] upsert error:", upsertErr);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  const { count } = await supabaseAdmin
    .from("waitlist_guesses")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ success: true, count: count ?? 0 });
}
