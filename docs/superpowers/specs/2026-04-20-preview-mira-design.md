# `/preview` — Live voice demo of MIRA

**Date:** 2026-04-20
**Status:** Design approved, pending implementation
**Owner:** Karthik Nagapuri

## Purpose

Ship a public `/preview` page where visitors can have a real-time voice conversation with **MIRA**, Synapse's proactive relationship assistant. It's a working demo (not a mockup) that showcases what MIRA feels like before the hardware ships.

## Non-goals

- No access gate (no password, no `ZERO` code — removed after discussion)
- No persistent conversation history
- No real contact data — MIRA runs without the user's graph in this demo
- No mobile-specific layout tweaks beyond responsive defaults
- No analytics pipeline

## Stack

| Concern | Choice |
|---|---|
| Voice pipeline | OpenAI Realtime API (single vendor, end-to-end) |
| Transport | WebRTC from browser ⇄ OpenAI, SDP offer/answer via our server |
| Auth | Ephemeral `client_secret` minted server-side per session |
| Model | `gpt-realtime` |
| Voice | `sage` (warm, calm) |
| Captions | `input_audio_transcription.model = whisper-1` + model's text output |
| Framework | Next.js 16 App Router, React 19, Tailwind v4 |
| Env | Reuse existing `OPENAI_API_KEY` — no new vars |

## UX flow

1. User lands on `/preview`. Sees **idle orb** (breathing), serif heading "Meet MIRA", caption "A proactive relationship assistant", single primary button **Start conversation**.
2. Click Start → browser mic prompt → on grant, client fetches `POST /api/realtime/session` → receives ephemeral `client_secret`.
3. Client opens `RTCPeerConnection`, attaches mic track, creates SDP offer, POSTs to `https://api.openai.com/v1/realtime?model=gpt-realtime` with the ephemeral token as Bearer auth, applies returned SDP answer.
4. Orb enters **live state**. WebAudio `AnalyserNode` on the local mic drives a "user speaking" amplitude; the remote audio track drives "MIRA speaking" amplitude. No gradients — depth via concentric ring opacity.
5. Live captions stream under the orb (2 lines visible, fading): user transcript (from `input_audio_transcription`) + MIRA transcript (from the model's text output channel).
6. Controls at bottom center: **Mute** (toggles mic track), **End** (closes peer, returns to idle). Keyboard: `space` push-to-talk when muted, `esc` ends.
7. Auto-disconnect after 5 minutes with a small toast: "Demo session ended."
8. After end → back to idle state with **Start again**.

## Visual spec

### Layout

- Full-bleed, marketing layout (existing `(marketing)` segment → keeps global nav/padding consistent)
- Centered column, max 640px
- Vertical rhythm:
  - 12vh top gap
  - H1 "Meet MIRA" (font-serif, `~40px`, `#1A1A1A`)
  - Subtitle "A proactive relationship assistant" (font-sans, 15px, `#888888`)
  - 80px gap
  - Orb (280×280)
  - 40px gap
  - Live captions area (min-height reserved to prevent layout shift)
  - 40px gap
  - Controls row

### Orb

- Canvas element, 280×280, `requestAnimationFrame` loop
- **Idle**: scale 0.95 ↔ 1.0 sine, period 4s, no color change
- **Live**: base scale 1.0 + (0.05 × userAmp) + (0.08 × modelAmp); 3 concentric rings with opacities driven by low/mid/high FFT bands
- Palette (no gradients):
  - Core: `#1A1A1A` (solid)
  - Ring 1: `#888888` @ variable opacity
  - Ring 2: `#AAAAAA` @ variable opacity
  - Ring 3: `#E5E5E3` @ variable opacity
- Disabled/muted state: all rings fade to 0.3 opacity, core desaturates to `#888888`

### Captions

- `font-sans`, `15px`, line-height 1.6, color `#888888`
- User turns prefixed with a light label (optional; keep minimal — start without labels)
- 2-line max visible, older lines fade out (opacity → 0 over 600ms)
- Text aligned center

### Controls

- Two pill buttons, 40px tall, 14px font-sans
- **Mute**: `border border-[#E5E5E3] bg-white text-[#1A1A1A]`, toggles to `bg-[#1A1A1A] text-white` when muted
- **End**: `bg-[#1A1A1A] text-white hover:bg-[#333333]`
- Disabled until WebRTC connected

## File layout

```
src/app/(marketing)/preview/page.tsx          # route, client component, orchestrates state
src/components/preview/mira-orb.tsx           # canvas orb (idle + live), amplitude props
src/components/preview/mira-session.ts        # useMiraSession() hook: WebRTC + transcripts
src/app/api/realtime/session/route.ts         # Node runtime: mints ephemeral token
src/lib/mira/prompt.ts                        # MIRA system prompt constant
```

No modifications to existing files (footer already has `/preview` link in Product column — added during this session).

## Backend: `POST /api/realtime/session`

- **Runtime**: Node (not Edge — uses `openai` SDK)
- **Rate limit**: in-memory `Map<ip, number[]>`, 6 sessions per IP per hour
  - Acceptable for demo scale; IP derived from `x-forwarded-for` (Vercel sets this)
  - On restart the map resets — acceptable; upgrade to Upstash if abuse becomes a problem
- **Body**: none required
- **Action**: calls OpenAI `POST /v1/realtime/sessions`:
  ```ts
  {
    model: "gpt-realtime",
    voice: "sage",
    instructions: MIRA_PROMPT,
    modalities: ["audio", "text"],
    input_audio_transcription: { model: "whisper-1" },
    turn_detection: { type: "server_vad", threshold: 0.5, silence_duration_ms: 400 }
  }
  ```
- **Response**: forwards `{ client_secret: { value, expires_at }, model, voice }` to client
- **Failure modes**:
  - Rate-limited → `429 { error: "rate_limited" }`
  - Upstream error → `502 { error: "upstream" }` + log
  - Missing env key → `500 { error: "misconfigured" }`

## MIRA system prompt (`src/lib/mira/prompt.ts`)

```
You are MIRA, Synapse's proactive relationship assistant.

Your role is to help people remember who matters and when to reach out. You
know their network and habits once connected, but this is a live voice demo,
so you don't have access to the user's real contacts yet.

Voice and style:
- Warm, calm, and brief — 1 to 2 sentences unless the user asks you to go
  deeper.
- Speak at a natural human pace. No filler words. No over-explaining.
- Acknowledge limits gracefully when asked things you can't do in this demo.

If the user asks what you can do, describe your role in one sentence and
offer one concrete example from their future life with Synapse (e.g.,
"Before a coffee next week, I'll surface what you last talked about and
anything they've shared publicly since.").

Never mention you are running on OpenAI or Realtime. You are MIRA.
```

## Error & edge cases

| Scenario | Behavior |
|---|---|
| Mic permission denied | Inline panel: "MIRA needs your microphone. Enable it in browser settings and reload." + button to retry |
| Ephemeral token fetch 429 | Inline: "Demo limit reached for this connection. Come back later." |
| Ephemeral token fetch 5xx | Inline: "Couldn't start the session. Try again." + retry button |
| WebRTC ICE timeout (>10s) | Same as above + suggest different network |
| Page hidden for 60s+ during live | Auto-end session (prevents silent billing) |
| 5-min cap reached | Toast + return to idle |
| Browser without WebRTC (very old) | Replace start button with "Your browser doesn't support live voice. Try Chrome, Safari, or Firefox." |

## Safety / cost

- Ephemeral tokens: ~60s TTL, single use, scoped per session
- 5-min client session cap (hard timeout via `setTimeout`)
- 6 sessions/IP/hr server cap
- No key ever exposed to client
- Realtime pricing (gpt-realtime): ~$0.06/min input + $0.24/min output; ~$0.50–$1 per 3-min session

## Rollout

1. Ship the route unlinked first (only accessible at `/preview`)
2. Smoke-test with 5-min cap and rate limit
3. Add the footer link (already planned in Product column)
4. Optional: add "Try MIRA" CTA near hero on `/` after stability proven

## Open questions

None blocking. Decisions made:
- No access code gate.
- Persona = MIRA (acronym undefined — left intentionally undefined so marketing can brand later).
- Voice = `sage`.
- Captions = on.
- Access = public.

## Testing

- Manual: grant/deny mic, start/end/mute/end, 5-min cap, rate-limit after 7th session from same IP, network loss mid-session, esc/space keys
- Browser matrix: latest Chrome, Safari, Firefox on macOS; Chrome & Safari on iOS
- No automated tests for this route initially — voice/WebRTC is brittle to test headlessly and out of scope for MVP demo
