import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// POST /api/friends/invite — create an invite link or send email invite
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email } = body;

  const inviteCode = crypto.randomBytes(16).toString("hex");

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      inviter_id: user.id,
      email: email?.trim() || `invite-${inviteCode}@placeholder`,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    invitation: data,
    invite_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://synapseai.com"}/invite/${inviteCode}`,
  });
}

// GET /api/friends/invite — list user's invitations
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("inviter_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ invitations: data || [] });
}
