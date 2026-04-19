# `/preview` MIRA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public `/preview` page with a working real-time voice conversation with MIRA powered by the OpenAI Realtime API.

**Architecture:** Browser opens a WebRTC peer directly to OpenAI Realtime using a short-lived ephemeral token minted by our Node API route. The page renders an animated canvas orb (driven by WebAudio amplitude data from both the local mic and the remote audio track) plus live captions streamed over the peer's data channel. No persistent state. All UI stays within the existing `(marketing)` layout.

**Tech Stack:** Next.js 16 App Router, React 19 (client components), TypeScript strict, Tailwind v4, `openai` SDK v6 (for types only — Realtime flow uses `fetch`), OpenAI Realtime API (`gpt-realtime`, voice `sage`).

**Repo notes:**
- Path alias `@/*` maps to `./src/*`.
- No test framework is installed; this plan uses `npx tsc --noEmit` + `npm run lint` + manual browser checks as the verification gates, per the design spec's "no automated tests for MVP" decision.
- Design spec: `docs/superpowers/specs/2026-04-20-preview-mira-design.md`.
- Marketing layout wraps pages with a fixed sidebar on lg+, mobile topbar, and `max-w-[860px]` content column.
- Existing env var `OPENAI_API_KEY` is already read by `src/lib/openai.ts`; the Realtime route reuses it.

**Files (one responsibility each):**

| Path | Role |
|---|---|
| `src/lib/mira/prompt.ts` | MIRA system prompt constant (exported) |
| `src/app/api/realtime/session/route.ts` | Node route handler — mints ephemeral token, rate-limits per IP |
| `src/components/preview/mira-session.ts` | `useMiraSession()` hook — owns peer connection, data channel, transcripts, amplitudes |
| `src/components/preview/mira-orb.tsx` | Canvas orb — consumes amplitudes, renders rings |
| `src/app/(marketing)/preview/page.tsx` | Route — orchestrates UI (headings, orb, captions, controls) |
| `src/app/(marketing)/layout.tsx` | Modify — repoint the existing sidebar "Try Demo" link from `/login` to `/preview` |

---

## Task 1: MIRA system prompt constant

**Files:**
- Create: `src/lib/mira/prompt.ts`

- [ ] **Step 1: Create the prompt file**

Create `src/lib/mira/prompt.ts`:

```ts
export const MIRA_PROMPT = `You are MIRA, Synapse's proactive relationship assistant.

Your role is to help people remember who matters and when to reach out. You know their network and habits once connected, but this is a live voice demo, so you don't have access to the user's real contacts yet.

Voice and style:
- Warm, calm, and brief — 1 to 2 sentences unless the user asks you to go deeper.
- Speak at a natural human pace. No filler words. No over-explaining.
- Acknowledge limits gracefully when asked things you can't do in this demo.

If the user asks what you can do, describe your role in one sentence and offer one concrete example from their future life with Synapse (e.g., "Before a coffee next week, I'll surface what you last talked about and anything they've shared publicly since.").

Never mention you are running on OpenAI or Realtime. You are MIRA.`;

export const MIRA_MODEL = "gpt-realtime";
export const MIRA_VOICE = "sage" as const;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `src/lib/mira/prompt.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mira/prompt.ts
git commit -m "Add MIRA system prompt constant"
```

---

## Task 2: Ephemeral-token API route

**Files:**
- Create: `src/app/api/realtime/session/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/realtime/session/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { MIRA_MODEL, MIRA_PROMPT, MIRA_VOICE } from "@/lib/mira/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function rateLimit(ip: string): boolean {
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `src/app/api/realtime/session/route.ts`.

- [ ] **Step 4: Start dev server in background**

Run: `npm run dev`
Expected: "Ready" line on http://localhost:3000.

- [ ] **Step 5: Smoke-test the route with curl**

Run:
```bash
curl -s -X POST http://localhost:3000/api/realtime/session -H "Content-Type: application/json" | jq .
```

Expected: JSON with shape `{ "client_secret": { "value": "...", "expires_at": 17... }, "model": "gpt-realtime", "voice": "sage" }`.

If you see `{ "error": "misconfigured" }`, check `.env.local` has `OPENAI_API_KEY`.
If you see `{ "error": "upstream" }`, check the dev server logs for the upstream error body.

- [ ] **Step 6: Verify rate limit**

Run the same curl 7 times in a row. The 7th response must be HTTP 429 with `{ "error": "rate_limited" }`. (Restart the dev server to reset.)

- [ ] **Step 7: Commit**

```bash
git add src/app/api/realtime/session/route.ts
git commit -m "Add ephemeral-token endpoint for MIRA Realtime sessions"
```

---

## Task 3: `useMiraSession` hook

Owns the WebRTC peer, data-channel event parsing, transcripts, and amplitude data.

**Files:**
- Create: `src/components/preview/mira-session.ts`

- [ ] **Step 1: Create the hook file**

Create `src/components/preview/mira-session.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MiraStatus =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "live"
  | "ending"
  | "mic-denied"
  | "rate-limited"
  | "error";

export type TranscriptLine = {
  id: string;
  speaker: "user" | "mira";
  text: string;
  final: boolean;
};

type SessionResponse = {
  client_secret?: { value: string; expires_at: number };
  model?: string;
  error?: string;
};

const REALTIME_URL = "https://api.openai.com/v1/realtime";
const MAX_SESSION_MS = 5 * 60 * 1000;

export function useMiraSession() {
  const [status, setStatus] = useState<MiraStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const modelAnalyserRef = useRef<AnalyserNode | null>(null);
  const userAmpRef = useRef(0);
  const modelAmpRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);
  const miraPartialRef = useRef<string>("");

  const readAmplitude = useCallback((analyser: AnalyserNode) => {
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / buf.length) * 3);
  }, []);

  const tick = useCallback(() => {
    if (userAnalyserRef.current) {
      userAmpRef.current = readAmplitude(userAnalyserRef.current);
    }
    if (modelAnalyserRef.current) {
      modelAmpRef.current = readAmplitude(modelAnalyserRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [readAmplitude]);

  const appendLine = useCallback((line: TranscriptLine) => {
    setTranscript((prev) => {
      const next = [...prev, line];
      return next.slice(-6);
    });
  }, []);

  const updateMiraPartial = useCallback((delta: string) => {
    miraPartialRef.current += delta;
    setTranscript((prev) => {
      const clone = [...prev];
      const lastIdx = clone.length - 1;
      if (
        lastIdx >= 0 &&
        clone[lastIdx].speaker === "mira" &&
        !clone[lastIdx].final
      ) {
        clone[lastIdx] = {
          ...clone[lastIdx],
          text: miraPartialRef.current,
        };
        return clone;
      }
      clone.push({
        id: `mira-${Date.now()}`,
        speaker: "mira",
        text: miraPartialRef.current,
        final: false,
      });
      return clone.slice(-6);
    });
  }, []);

  const finalizeMira = useCallback(() => {
    setTranscript((prev) => {
      if (prev.length === 0) return prev;
      const clone = [...prev];
      const lastIdx = clone.length - 1;
      if (clone[lastIdx].speaker === "mira") {
        clone[lastIdx] = { ...clone[lastIdx], final: true };
      }
      return clone;
    });
    miraPartialRef.current = "";
  }, []);

  const handleEvent = useCallback(
    (raw: string) => {
      let ev: { type?: string; transcript?: string; delta?: string };
      try {
        ev = JSON.parse(raw);
      } catch {
        return;
      }
      if (!ev.type) return;

      if (
        ev.type === "conversation.item.input_audio_transcription.completed" &&
        typeof ev.transcript === "string"
      ) {
        appendLine({
          id: `user-${Date.now()}`,
          speaker: "user",
          text: ev.transcript,
          final: true,
        });
        return;
      }

      if (ev.type === "response.audio_transcript.delta" && typeof ev.delta === "string") {
        updateMiraPartial(ev.delta);
        return;
      }

      if (ev.type === "response.audio_transcript.done") {
        finalizeMira();
        return;
      }
    },
    [appendLine, updateMiraPartial, finalizeMira]
  );

  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (endTimerRef.current !== null) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    userAnalyserRef.current = null;
    modelAnalyserRef.current = null;
    userAmpRef.current = 0;
    modelAmpRef.current = 0;
    miraPartialRef.current = "";
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle" && status !== "mic-denied" && status !== "error" && status !== "rate-limited") {
      return;
    }
    setTranscript([]);
    setMuted(false);
    setStatus("requesting-mic");

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("mic-denied");
      return;
    }
    micStreamRef.current = micStream;
    setStatus("connecting");

    let sessionData: SessionResponse;
    try {
      const res = await fetch("/api/realtime/session", { method: "POST" });
      sessionData = (await res.json()) as SessionResponse;
      if (res.status === 429 || sessionData.error === "rate_limited") {
        setStatus("rate-limited");
        teardown();
        return;
      }
      if (!res.ok || !sessionData.client_secret) {
        setStatus("error");
        teardown();
        return;
      }
    } catch {
      setStatus("error");
      teardown();
      return;
    }

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    remoteAudioRef.current = audioEl;

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      audioEl.srcObject = remoteStream;
      const source = ctx.createMediaStreamSource(remoteStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      modelAnalyserRef.current = analyser;
    };

    micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

    const userSource = ctx.createMediaStreamSource(micStream);
    const userAnalyser = ctx.createAnalyser();
    userAnalyser.fftSize = 512;
    userSource.connect(userAnalyser);
    userAnalyserRef.current = userAnalyser;

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.onmessage = (e) => handleEvent(typeof e.data === "string" ? e.data : "");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = sessionData.model ?? "gpt-realtime";
    let sdpAnswer: string;
    try {
      const sdpRes = await fetch(`${REALTIME_URL}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp ?? "",
      });
      if (!sdpRes.ok) {
        setStatus("error");
        teardown();
        return;
      }
      sdpAnswer = await sdpRes.text();
    } catch {
      setStatus("error");
      teardown();
      return;
    }

    await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });
    setStatus("live");

    rafRef.current = requestAnimationFrame(tick);
    endTimerRef.current = window.setTimeout(() => {
      setStatus("ending");
      teardown();
      setStatus("idle");
    }, MAX_SESSION_MS);
  }, [handleEvent, status, teardown, tick]);

  const end = useCallback(() => {
    setStatus("ending");
    teardown();
    setStatus("idle");
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const stream = micStreamRef.current;
    if (!stream) return;
    setMuted((prev) => {
      const next = !prev;
      stream.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
    status,
    muted,
    transcript,
    userAmpRef,
    modelAmpRef,
    start,
    end,
    toggleMute,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file. If ESLint flags unused imports or `any`, tighten types rather than disabling rules.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-session.ts
git commit -m "Add useMiraSession hook for WebRTC + transcript streaming"
```

---

## Task 4: `MiraOrb` canvas component

**Files:**
- Create: `src/components/preview/mira-orb.tsx`

- [ ] **Step 1: Create the orb component**

Create `src/components/preview/mira-orb.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

type AmpRef = { current: number };

type Props = {
  size?: number;
  live: boolean;
  muted?: boolean;
  userAmpRef: AmpRef;
  modelAmpRef: AmpRef;
};

export function MiraOrb({
  size = 280,
  live,
  muted = false,
  userAmpRef,
  modelAmpRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    startRef.current = performance.now();

    const draw = (now: number) => {
      const t = (now - startRef.current) / 1000;
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const coreBase = size * 0.22;

      const breathing = 0.95 + Math.sin((t / 2) * Math.PI) * 0.025 + 0.025;
      const userAmp = live ? userAmpRef.current : 0;
      const modelAmp = live ? modelAmpRef.current : 0;

      const scale = live
        ? 1 + userAmp * 0.05 + modelAmp * 0.08
        : breathing;

      const dim = muted ? 0.35 : 1;
      const baseRingAlpha = live ? 0.55 : 0.35;

      ctx.fillStyle = muted ? "#888888" : "#1A1A1A";

      const ring = (radius: number, color: string, alpha: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * dim;
        ctx.fill();
      };

      ring(
        coreBase * scale * 2.4,
        "#E5E5E3",
        baseRingAlpha * 0.45 + modelAmp * 0.25
      );
      ring(
        coreBase * scale * 1.85,
        "#AAAAAA",
        baseRingAlpha * 0.55 + modelAmp * 0.2
      );
      ring(
        coreBase * scale * 1.35,
        "#888888",
        baseRingAlpha * 0.65 + userAmp * 0.25
      );

      ctx.globalAlpha = dim;
      ctx.beginPath();
      ctx.arc(cx, cy, coreBase * scale, 0, Math.PI * 2);
      ctx.fillStyle = muted ? "#888888" : "#1A1A1A";
      ctx.fill();
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [live, muted, size, userAmpRef, modelAmpRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="select-none"
    />
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-orb.tsx
git commit -m "Add MiraOrb canvas component"
```

---

## Task 5: `/preview` page

**Files:**
- Create: `src/app/(marketing)/preview/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(marketing)/preview/page.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { MiraOrb } from "@/components/preview/mira-orb";
import { useMiraSession } from "@/components/preview/mira-session";

export default function PreviewPage() {
  const {
    status,
    muted,
    transcript,
    userAmpRef,
    modelAmpRef,
    start,
    end,
    toggleMute,
  } = useMiraSession();

  const live = status === "live";
  const busy = status === "requesting-mic" || status === "connecting";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && live) end();
      if (e.code === "Space" && live && muted) {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, muted, end, toggleMute]);

  useEffect(() => {
    if (!live) return;
    let hideTimer: number | null = null;
    const onVis = () => {
      if (document.hidden) {
        hideTimer = window.setTimeout(() => end(), 60_000);
      } else if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (hideTimer !== null) window.clearTimeout(hideTimer);
    };
  }, [live, end]);

  return (
    <div className="flex flex-col items-center text-center pt-[8vh] pb-24">
      <h1 className="text-[#1A1A1A] text-[32px] sm:text-[40px] font-normal leading-[1.12] font-serif mb-4">
        Meet MIRA
      </h1>
      <p className="text-[#888888] text-[15px] font-sans max-w-[420px] mb-16">
        A proactive relationship assistant. Speak naturally — MIRA listens, remembers, and replies in real time.
      </p>

      <div className="mb-10">
        <MiraOrb
          live={live}
          muted={muted}
          userAmpRef={userAmpRef}
          modelAmpRef={modelAmpRef}
        />
      </div>

      <div className="min-h-[72px] max-w-[540px] w-full px-4 mb-10" aria-live="polite">
        {transcript.length === 0 ? (
          <p className="text-[#AAAAAA] text-[14px] font-sans">
            {live ? "Listening…" : "Press start to begin."}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {transcript.slice(-2).map((line) => (
              <p
                key={line.id}
                className={
                  "text-[15px] font-sans leading-[1.6] " +
                  (line.speaker === "mira" ? "text-[#1A1A1A]" : "text-[#888888]")
                }
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {status === "mic-denied" && (
        <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
          MIRA needs your microphone. Enable it in your browser settings and reload the page.
        </div>
      )}
      {status === "rate-limited" && (
        <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
          Demo limit reached for this connection. Please come back later.
        </div>
      )}
      {status === "error" && (
        <div className="max-w-[420px] text-[#888888] text-[14px] font-sans mb-6">
          Couldn&apos;t start the session. Please try again.
        </div>
      )}

      <div className="flex items-center gap-3">
        {live ? (
          <>
            <button
              onClick={toggleMute}
              className={
                "px-5 h-10 rounded-full text-[14px] font-sans font-medium transition-colors duration-200 " +
                (muted
                  ? "bg-[#1A1A1A] text-white hover:bg-[#333333]"
                  : "border border-[#E5E5E3] bg-white text-[#1A1A1A] hover:border-[#AAAAAA]")
              }
            >
              {muted ? "Muted" : "Mute"}
            </button>
            <button
              onClick={end}
              className="px-5 h-10 rounded-full bg-[#1A1A1A] text-white text-[14px] font-sans font-medium hover:bg-[#333333] transition-colors duration-200"
            >
              End
            </button>
          </>
        ) : (
          <button
            onClick={start}
            disabled={busy}
            className="px-6 h-11 rounded-full bg-[#1A1A1A] text-white text-[14px] font-sans font-medium hover:bg-[#333333] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {busy ? "Connecting…" : status === "idle" ? "Start conversation" : "Start again"}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Manual browser smoke test — idle state**

Make sure dev server is running (`npm run dev`). Open `http://localhost:3000/preview` in Chrome.

Expected:
- Serif "Meet MIRA" heading and subtitle render.
- Canvas orb is visible and breathing slowly.
- "Start conversation" button is enabled.
- No console errors.

- [ ] **Step 5: Manual browser smoke test — live session**

Click **Start conversation**. Grant microphone permission when prompted.

Expected:
- Button text changes to "Connecting…", then the button row swaps to Mute + End.
- Orb switches to live (reacts to your voice).
- Speak a greeting. Within ~1s, MIRA audio plays back through speakers.
- Under the orb, your words appear (user transcript) then MIRA's reply appears (streaming).
- Click **Mute** — orb dims, your audio track stops being sent (verify by speaking — MIRA should stop responding until you un-mute).
- Press **Esc** — session ends, page returns to idle.

If any step fails, check browser console and dev-server logs; do NOT mark this step complete.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(marketing\)/preview/page.tsx
git commit -m "Add /preview page with MIRA orb and live captions"
```

---

## Task 6: Point nav "Try Demo" at `/preview`

The sidebar in the marketing layout currently links "Try Demo" to `/login`. Retarget it to `/preview`.

**Files:**
- Modify: `src/app/(marketing)/layout.tsx` (two occurrences — mobile menu + desktop sidebar)

- [ ] **Step 1: Update both "Try Demo" links**

Replace both occurrences of `href="/login"` on the "Try Demo" links (one inside the mobile menu block, one in the desktop sidebar block). Use this single Edit with `replace_all: true` since the link string is identical:

```diff
-              <Link
-                href="/login"
-                className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
-                onClick={() => setMobileMenuOpen(false)}
-              >
-                Try Demo
-              </Link>
+              <Link
+                href="/preview"
+                className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
+                onClick={() => setMobileMenuOpen(false)}
+              >
+                Try Demo
+              </Link>
```

And the desktop sidebar version (no `onClick`):

```diff
-            <Link
-              href="/login"
-              className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
-            >
-              Try Demo
-            </Link>
+            <Link
+              href="/preview"
+              className="text-[#888888] text-[15px] font-sans hover:text-[#1A1A1A] transition-colors duration-200"
+            >
+              Try Demo
+            </Link>
```

Apply both edits.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output / exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual verify — navigation**

With dev server running, load `http://localhost:3000/`. Click **Try Demo** in the right sidebar.
Expected: navigates to `/preview`.

Resize below `lg` breakpoint (≤1023px). Open the mobile menu. Click **Try Demo**.
Expected: navigates to `/preview` and closes the menu.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/layout.tsx
git commit -m "Point 'Try Demo' nav link at /preview"
```

---

## Final verification

- [ ] **Step 1: Fresh build check**

Run: `npm run build`
Expected: build succeeds; no type errors; `/preview` appears in the route list.

- [ ] **Step 2: Re-run lint on full project**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Full manual run**

Run: `npm run dev`, open `/preview`, complete a full 30-second conversation with MIRA, verify:
- Orb reacts to both user and MIRA speech.
- Captions appear for both sides.
- Mute stops the user's audio upstream.
- End returns to idle; Start again works.
- 5-minute cap: (optional) modify `MAX_SESSION_MS` temporarily to 30_000, verify auto-return to idle, then revert.
