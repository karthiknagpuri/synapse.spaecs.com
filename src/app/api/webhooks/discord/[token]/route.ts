import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/webhooks/discord/:token — handle Discord interaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://synapseai.com"}/api/webhooks/discord/${token}`;

  const body = await request.json();

  // Discord verification ping
  if (body.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  const supabase = await createClient();

  // Find bot by webhook URL
  const { data: bot } = await supabase
    .from("group_bots")
    .select("*")
    .eq("webhook_url", webhookUrl)
    .eq("platform", "discord")
    .eq("status", "active")
    .single();

  if (!bot) {
    return NextResponse.json({
      type: 4,
      data: { content: "Bot not configured.", flags: 64 },
    });
  }

  // Handle slash command
  const query = body.data?.options?.[0]?.value || "";
  const userName = body.member?.user?.username || "unknown";

  if (!query.trim()) {
    return NextResponse.json({
      type: 4,
      data: {
        content:
          "Usage: `/search [query]` — e.g., `/search founders in San Francisco`",
        flags: 64,
      },
    });
  }

  // Get group members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", bot.group_id);

  const memberIds = (members || []).map((m) => m.user_id);

  // Search contacts
  const { data: contacts } = await supabase
    .from("contacts")
    .select("full_name, email, company, title, location")
    .in("user_id", memberIds)
    .or(
      `full_name.ilike.%${query}%,company.ilike.%${query}%,title.ilike.%${query}%,location.ilike.%${query}%`
    )
    .limit(5);

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({
      type: 4,
      data: { content: `No results found for "${query}".` },
    });
  }

  const resultText = contacts
    .map(
      (c, i) =>
        `${i + 1}. **${c.full_name}**${c.title ? ` — ${c.title}` : ""}${c.company ? ` at ${c.company}` : ""}${c.location ? ` (${c.location})` : ""}`
    )
    .join("\n");

  return NextResponse.json({
    type: 4,
    data: {
      content: `🔍 Results for "${query}" (searched by ${userName}):\n\n${resultText}`,
    },
  });
}
