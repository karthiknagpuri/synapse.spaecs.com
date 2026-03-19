import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/webhooks/slack/:token — handle Slack slash command /search
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://synapseai.com"}/api/webhooks/slack/${token}`;

  const supabase = await createClient();

  // Find bot by webhook URL
  const { data: bot } = await supabase
    .from("group_bots")
    .select("*, group:groups(*)")
    .eq("webhook_url", webhookUrl)
    .eq("platform", "slack")
    .eq("status", "active")
    .single();

  if (!bot) {
    return NextResponse.json(
      { response_type: "ephemeral", text: "Bot not configured." },
      { status: 200 }
    );
  }

  // Parse Slack form data
  const formData = await request.formData();
  const text = formData.get("text") as string;
  const userName = formData.get("user_name") as string;

  if (!text?.trim()) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Usage: `/search [query]` — e.g., `/search founders in San Francisco`",
    });
  }

  // Get group members to search across their networks
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", bot.group_id);

  const memberIds = (members || []).map((m) => m.user_id);

  // Search contacts across all group members
  const { data: contacts } = await supabase
    .from("contacts")
    .select("full_name, email, company, title, location")
    .in("user_id", memberIds)
    .or(
      `full_name.ilike.%${text}%,company.ilike.%${text}%,title.ilike.%${text}%,location.ilike.%${text}%`
    )
    .limit(5);

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: `No results found for "${text}".`,
    });
  }

  const resultText = contacts
    .map(
      (c, i) =>
        `${i + 1}. *${c.full_name}*${c.title ? ` — ${c.title}` : ""}${c.company ? ` at ${c.company}` : ""}${c.location ? ` (${c.location})` : ""}`
    )
    .join("\n");

  return NextResponse.json({
    response_type: "in_channel",
    text: `🔍 Results for "${text}" (searched by @${userName}):\n\n${resultText}`,
  });
}
