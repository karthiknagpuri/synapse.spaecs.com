import { NextRequest, NextResponse } from "next/server";
import { MIRA_MODEL, MIRA_PROMPT, MIRA_VOICE } from "@/lib/mira/prompt";
import { MIRA_TOOLS } from "@/lib/mira/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const RATE_LIMIT_ENABLED = process.env.NODE_ENV === "production";
const hits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function rateLimit(ip: string): boolean {
  if (!RATE_LIMIT_ENABLED) return true;
  const now = Date.now();
  const arr = hits.get(ip) ?? [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_PER_WINDOW) {
    hits.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  hits.set(ip, fresh);
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MIRA_MODEL,
        voice: MIRA_VOICE,
        instructions: MIRA_PROMPT,
        modalities: ["audio", "text"],
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 400,
        },
        tools: MIRA_TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error("[realtime/session] upstream error", upstream.status, body);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }

    const data = (await upstream.json()) as {
      client_secret: { value: string; expires_at: number };
      model: string;
    };

    return NextResponse.json({
      client_secret: data.client_secret,
      model: data.model,
      voice: MIRA_VOICE,
    });
  } catch (err) {
    console.error("[realtime/session] fetch failed", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
