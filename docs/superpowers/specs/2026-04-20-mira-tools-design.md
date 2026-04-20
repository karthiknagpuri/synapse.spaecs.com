# MIRA tool calling + action cards (showpiece demo)

**Date:** 2026-04-20
**Status:** Approved, pending implementation
**Owner:** Karthik Nagapuri
**Extends:** `2026-04-20-preview-mira-design.md`

## Purpose

Turn the `/preview` demo into a compelling executive-assistant showpiece. During a voice conversation, MIRA detects intent and triggers mock actions that appear as animated cards in a right-side panel. Visitor should feel like they just watched a personal chief-of-staff take 6–8 actions across their work and life in under three minutes.

**Strictly a demo:** nothing persists, no real emails or food orders, no DB writes, no external scraping. The goal is perceived capability.

## Non-goals

- No authentication or per-user state.
- No writes to Supabase, Gmail, LinkedIn, Twitter, Swiggy, Zomato.
- No card editing, dismissal, or reordering by the user.
- No mobile-specific refinements beyond a vertical card stack.
- No analytics.

## Stack (additions only)

Continues on top of the `/preview` build already live at https://synapsespaecscom.vercel.app/preview.

| Concern | Choice |
|---|---|
| Tool calling | OpenAI Realtime function tools declared in `session.tools` |
| Event channel | Existing `oai-events` data channel — listen for `response.function_call_arguments.done` |
| Mock handlers | Pure client-side functions in `src/lib/mira/tools.ts`, no network calls |
| Rendering | One shared `MiraCard` component with a `type` discriminator |
| Animation | CSS transitions + a tiny canvas sparkle burst on entry |

## UX flow

1. Visitor starts a MIRA session on `/preview` (unchanged).
2. During conversation, the moment MIRA's turn detector decides the user expressed an intent, she silently calls a tool.
3. The client receives `response.function_call_arguments.done`, parses JSON args, runs the mock handler (instant — no await on network), and pushes a card onto the panel.
4. Card slides in from the right, triggers a sparkle burst, and remains visible. MIRA, in parallel, says a short natural confirmation ("Got it — added that for Priya").
5. Stack keeps a soft cap of 5 visible cards. Older ones fade and collapse out.
6. On session end, panel is cleared.

## Card types

All 8 types are variants of one `MiraCard`. They share container chrome (padding, radius, subtle border, sparkle on entry) and differ in the body layout.

| Type | Icon | Title | Body |
|---|---|---|---|
| `todo` | 📋 | "Todo added" | title, optional due chip |
| `win` | ✨ | "Win captured" | text, optional emoji chip |
| `contact` | 👤 | "Contact added" | name, "{role} · {company}", mocked LinkedIn headline, 2 tag chips |
| `email` | ✉️ | "Draft ready" | to, subject, 3-line body preview, "Review →" ghost button (decorative) |
| `food` | 🍛 | "Logged" | item + qty, large kcal number, macro mini-bars |
| `pitch` | 🎯 | "Pitch summary" | three mini-sections: Wins / Objections / Next steps |
| `followup` | 🔁 | "Follow-up drafted" | contact name + company, 2-line drafted email |
| `fade` | 📉 | "Reconnect" | three mini-rows of fading contacts; one shows "at Nasscom 10xC · Bengaluru — now" with a "Call" ghost button |

### Mock data sources (fixed at build time)

- **Contact scrape table** (in `tools.ts`): map of lowercased first name → `{ headline, recentPost, tags }`. Unknown names fall back to a generic "Founder · Building something interesting" stub with two plausible tags.
- **Calorie table**: `biryani` 850, `chai` 60, `dosa` 320, `idli` 60, `coffee` 5, default 300. Qty multiplier applied.
- **Pitch analysis**: two canned summaries picked by `topic` keyword (e.g., containing "zerodha" → closes-the-loop flavor; else → generic seed-round flavor).
- **Followup template**: name slot + hardcoded 2-line body.
- **Fading contacts**: hardcoded trio: `Priya Shah` (at Nasscom 10xC, Bengaluru, now), `Rohit M.` (27 days silent), `Ananya K.` (41 days silent).

## Tool schema

Declared in the `/api/realtime/session` request body as the `tools` array. Each tool mirrors the card's argument shape:

```jsonc
// add_todo
{ "title": "string", "due": "string (optional, e.g. '5pm', 'tomorrow')" }

// add_win
{ "text": "string" }

// add_contact
{ "name": "string", "role": "string (optional)", "company": "string (optional)", "met_at": "string (optional)" }

// draft_email
{ "to": "string", "subject": "string", "body": "string" }

// log_food
{ "item": "string", "qty": "number (optional, default 1)" }

// analyze_pitch
{ "topic": "string" }

// followup_deal
{ "deal": "string (deal name or company)" }

// show_fading_contacts
{}  // no args
```

All eight are registered with `tool_choice: "auto"` (default) so MIRA decides when to call them.

## System prompt addition

Appended to `MIRA_PROMPT` (as a second paragraph):

> Whenever the user mentions something you can capture or act on — a task, a win, a person they met, an email they want to send, food they ate, a pitch they want analyzed, a deal that didn't close, or asks who they're losing touch with — call the matching tool with the details you heard. After the tool call, reply in one natural sentence confirming ("Got it — added that"). Never mention "tools", "functions", or that you just called anything. Speak like a human chief-of-staff who just wrote it down.

## Client-side event handling

In `mira-session.ts`, listen for two new event types in addition to the existing transcript events:

- `response.function_call_arguments.done` — final JSON args string is available in `ev.arguments`; parse and run the mock handler. Also grab `ev.name` for the tool name and `ev.call_id` for dedup.
- `response.done` — no-op for now; left as a placeholder in case we later want to auto-close a turn.

Each handler produces a `CardEvent` typed object (`{ id, type, payload }`), which is pushed to a `cards` state list on the page. The list is capped to the last 5 entries; older entries get an `exiting: true` flag for a 260ms fade/collapse before being removed from the array.

## Animation detail

- **Card entry**: `transform: translateY(12px) scale(0.985)` → `translateY(0) scale(1)`, opacity `0 → 1`, duration 320ms, easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Sparkle burst**: 8 particles spawned at the top-right of a freshly mounted card, radiate outward 32–48px over 600ms, size 2–3px, color `#1A1A1A` at 0.9 → 0 alpha. Pure DOM (absolutely positioned dots), no canvas needed.
- **Card exit**: reversed entry; opacity → 0 and `max-height → 0` over 260ms.
- **Respect `prefers-reduced-motion`**: when set, entry is a simple opacity fade, no sparkle, no translate.

## File layout

### New files

```
src/lib/mira/tools.ts                        — tool schema + mock handlers
src/components/preview/mira-card.tsx         — shared card component (variant switch)
src/components/preview/mira-sparkle.tsx      — sparkle burst primitive
src/components/preview/mira-panel.tsx        — right-side card stack
```

### Modified files

```
src/lib/mira/prompt.ts                       — append tool-usage paragraph
src/app/api/realtime/session/route.ts        — include MIRA_TOOLS in session body
src/components/preview/mira-session.ts       — handle function-call events + expose cards state
src/app/(marketing)/preview/page.tsx         — render <MiraPanel /> alongside the orb
```

## Responsive layout

- **≥ lg (1024+)**: orb center-left; `MiraPanel` absolutely positioned top-right of the main column, 320px wide, max-height `calc(100vh - 160px)`, vertical stack.
- **< lg**: panel moves beneath the controls as a vertical stack at full container width with max-height 60vh and internal scroll.

## Error handling and edge cases

| Scenario | Behavior |
|---|---|
| MIRA calls a tool with missing required fields | Handler falls back to sensible defaults (e.g., todo with empty title shows "Untitled"); no crash |
| Tool call with unknown `name` | Log to console, ignore — no card appears |
| Model returns malformed JSON in `arguments` | `try/catch` around `JSON.parse`; ignore that call; continue |
| User speaks faster than Realtime can commit a turn | Cards arrive out of spoken order sometimes — acceptable for a demo |
| Fading-contact card is shown twice in a session | Allowed; each call produces a new card |

## Cost

- Tool calling does not change Realtime pricing meaningfully — it's just extra tokens in the session config and short JSON in outputs. Negligible per-session.

## Success criteria (demo bar)

In a 2–3 minute fresh session, a visitor should be able to trigger and visually see at least 5 distinct card types by speaking naturally. No card should require the visitor to use specific phrasing — MIRA infers intent from everyday sentences like "I had biryani for lunch" or "I just met Rohan, founder at FinX".

## Testing

- **Manual scripted run** on `/preview`: visitor says a sentence per card type from a prepared list (in the plan), verifying the right card appears with the right fields and the sparkle animation plays.
- **No automated tests** for this route (continues the prior decision — voice pipeline is not cheaply headless-testable).

## Rollout

1. Ship behind the same public `/preview` URL — this is the demo.
2. Optional: after shipping, add a small `Tips` link on `/preview` with 3 example sentences so first-time visitors know what to say. Not in this spec.

## Open questions

None blocking. Decisions made:
- Mode = Full mock (option A).
- All 8 card types in scope.
- Side-panel stack, newest-on-top.
- Sparkle = DOM particles (not canvas) for simplicity.
- Soft cap of 5 visible cards.
