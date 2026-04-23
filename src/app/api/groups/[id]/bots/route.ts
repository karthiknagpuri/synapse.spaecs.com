import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// GET /api/groups/:id/bots — list bots for a group
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bots } = await supabase
    .from("group_bots")
    .select("*")
    .eq("group_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ bots: bots || [] });
}

// POST /api/groups/:id/bots — enable a bot for a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await request.json();
  const { platform } = body;

  if (!["slack", "discord", "email"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const config: Record<string, string> = {};
  const webhookToken = crypto.randomBytes(24).toString("hex");
  let webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://wearsynapse.com"}/api/webhooks/${platform}/${webhookToken}`;

  if (platform === "email") {
    // Generate unique group email address
    const groupSlug = crypto.randomBytes(6).toString("hex");
    config.email_address = `group-${groupSlug}@synapseai.com`;
    webhookUrl = config.email_address;
  }

  const { data: bot, error } = await supabase
    .from("group_bots")
    .upsert(
      {
        group_id: id,
        platform,
        status: platform === "email" ? "active" : "pending",
        config,
        webhook_url: webhookUrl,
        created_by: user.id,
      },
      { onConflict: "group_id,platform" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bot });
}

// DELETE /api/groups/:id/bots — disable a bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { platform } = body;

  const { error } = await supabase
    .from("group_bots")
    .update({ status: "disconnected" })
    .eq("group_id", id)
    .eq("platform", platform);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
