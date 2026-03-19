import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key, last_used_at, created_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Mask keys — only show first 8 and last 4 chars
  const masked = (keys || []).map((k) => ({
    ...k,
    key: k.revoked_at
      ? "syn_****"
      : `${k.key.slice(0, 8)}${"*".repeat(Math.max(0, k.key.length - 12))}${k.key.slice(-4)}`,
  }));

  return NextResponse.json({ keys: masked });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = body.name || "Default";
  const key = `syn_${crypto.randomBytes(24).toString("hex")}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, name, key })
    .select("id, name, key, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the full key only on creation — it won't be shown again
  return NextResponse.json({ key: data });
}
