# MIRA tool-calling + action cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `/preview` demo into a live executive-assistant showpiece — MIRA detects intent mid-conversation and triggers mock action cards (todo/win/contact/email/food/pitch/followup/fading-contacts) that animate into a right-side panel with sparkle bursts.

**Architecture:** Declare eight function tools on the existing OpenAI Realtime session. When MIRA calls a tool, the `oai-events` data channel delivers `response.function_call_arguments.done`. The client parses the JSON arguments, runs a pure client-side mock handler that returns a typed `CardEvent`, and pushes the event onto a React state list. A new `MiraPanel` component renders the list as animated cards anchored to the right side of the page.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript strict, Tailwind v4, Web Animations API for sparkle + card entry. No new dependencies. All mock data is hardcoded — no DB, no external APIs.

**Repo conventions:**
- Path alias `@/*` → `./src/*`.
- Verification gates per task: `npx tsc --noEmit`, `npm run lint`, manual browser smoke test where relevant.
- Git author: `Karthik Nagapuri <19h61a3538@cvsr.ac.in>`. No `Co-Authored-By` trailer.
- No test framework; per the spec, we rely on type-check + lint + manual browser checks.

**Design spec:** `docs/superpowers/specs/2026-04-20-mira-tools-design.md`.

**Files (one responsibility each):**

| Path | Role | Status |
|---|---|---|
| `src/lib/mira/tools.ts` | Tool schema + mock handlers + `CardEvent` types | Create |
| `src/lib/mira/prompt.ts` | Append tool-usage paragraph to `MIRA_PROMPT` | Modify |
| `src/app/api/realtime/session/route.ts` | Include `MIRA_TOOLS` in session body | Modify |
| `src/components/preview/mira-sparkle.tsx` | Sparkle burst primitive | Create |
| `src/components/preview/mira-card.tsx` | Shared `MiraCard` component with variant switch | Create |
| `src/components/preview/mira-panel.tsx` | Right-side stack of cards | Create |
| `src/components/preview/mira-session.ts` | Handle `response.function_call_arguments.done`, expose `cards` + `clearCards` | Modify |
| `src/app/(marketing)/preview/page.tsx` | Mount `<MiraPanel />` alongside orb | Modify |

---

## Task 1: Tool schema + mock handlers

**Files:**
- Create: `src/lib/mira/tools.ts`

- [ ] **Step 1: Create the tools file**

Create `src/lib/mira/tools.ts`:

```ts
export type TodoPayload = { title: string; due: string | null };
export type WinPayload = { text: string };
export type ContactPayload = {
  name: string;
  role: string | null;
  company: string | null;
  metAt: string | null;
  headline: string;
  tags: string[];
};
export type EmailPayload = { to: string; subject: string; body: string };
export type FoodPayload = { item: string; qty: number; kcal: number };
export type PitchPayload = {
  topic: string;
  wins: string[];
  objections: string[];
  next: string[];
};
export type FollowupPayload = {
  deal: string;
  contactName: string;
  company: string;
  body: string;
};
export type FadingContact = {
  name: string;
  context: string;
  liveEvent: boolean;
};
export type FadePayload = { contacts: FadingContact[] };

export type CardEvent =
  | { id: string; type: "todo"; payload: TodoPayload }
  | { id: string; type: "win"; payload: WinPayload }
  | { id: string; type: "contact"; payload: ContactPayload }
  | { id: string; type: "email"; payload: EmailPayload }
  | { id: string; type: "food"; payload: FoodPayload }
  | { id: string; type: "pitch"; payload: PitchPayload }
  | { id: string; type: "followup"; payload: FollowupPayload }
  | { id: string; type: "fade"; payload: FadePayload };

export const MIRA_TOOLS = [
  {
    type: "function",
    name: "add_todo",
    description:
      "Capture a todo or task the user mentioned. Include a due hint if they said one (e.g. '5pm', 'tomorrow').",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task description" },
        due: { type: "string", description: "Optional human-readable due hint" },
      },
      required: ["title"],
    },
  },
  {
    type: "function",
    name: "add_win",
    description:
      "Capture a personal or professional win the user shared (closed deal, shipped feature, ran a 5k, etc.).",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "One-sentence description of the win" },
      },
      required: ["text"],
    },
  },
  {
    type: "function",
    name: "add_contact",
    description:
      "Add a new person to the user's network when they mention meeting someone.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        role: { type: "string", description: "Their role or title if mentioned" },
        company: { type: "string", description: "Their company if mentioned" },
        met_at: { type: "string", description: "Where/when they met (optional)" },
      },
      required: ["name"],
    },
  },
  {
    type: "function",
    name: "draft_email",
    description:
      "Draft an email the user said they would send. Compose a short, professional body.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient name or email" },
        subject: { type: "string" },
        body: { type: "string", description: "2-4 sentence body" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    type: "function",
    name: "log_food",
    description: "Log a meal or snack the user mentioned eating.",
    parameters: {
      type: "object",
      properties: {
        item: { type: "string", description: "Food item name (e.g. 'biryani')" },
        qty: {
          type: "number",
          description: "Quantity or portions, default 1",
        },
      },
      required: ["item"],
    },
  },
  {
    type: "function",
    name: "analyze_pitch",
    description:
      "Summarize the user's last sales pitch or investor call with wins, objections, and next steps.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Who or what the pitch was about (e.g. 'Zerodha', 'seed round')",
        },
      },
      required: ["topic"],
    },
  },
  {
    type: "function",
    name: "followup_deal",
    description:
      "Draft a re-engagement email for a deal that didn't close. Identify the relevant contact from context.",
    parameters: {
      type: "object",
      properties: {
        deal: {
          type: "string",
          description: "Deal name, company, or person (e.g. 'Zerodha', 'Acme partnership')",
        },
      },
      required: ["deal"],
    },
  },
  {
    type: "function",
    name: "show_fading_contacts",
    description:
      "Show a few people the user is losing touch with. Use when they ask who they're drifting from or who they should reach out to.",
    parameters: { type: "object", properties: {} },
  },
] as const;

const CALORIE_TABLE: Record<string, number> = {
  biryani: 850,
  pizza: 280,
  dosa: 320,
  idli: 60,
  chai: 60,
  coffee: 5,
  samosa: 260,
  salad: 180,
  burger: 540,
  rice: 210,
  chapati: 120,
  chicken: 240,
  egg: 78,
  apple: 95,
  banana: 105,
};

function lookupCalories(item: string, qty: number): number {
  const key = item.trim().toLowerCase();
  const base = CALORIE_TABLE[key] ?? 300;
  return Math.round(base * qty);
}

const CONTACT_TABLE: Record<
  string,
  { headline: string; tags: string[] }
> = {
  rohan: {
    headline: "Building fintech rails for Bharat · ex-Razorpay",
    tags: ["Fintech", "Founder"],
  },
  priya: {
    headline: "Leading growth at Nasscom 10xC · angel investor",
    tags: ["Growth", "Investor"],
  },
  sarah: {
    headline: "Product lead at Acme · partnerships",
    tags: ["Product", "Partnerships"],
  },
  ananya: {
    headline: "Creator · 120k subscribers on tech commentary",
    tags: ["Creator", "Media"],
  },
  rohit: {
    headline: "Engineer at Microsoft · India AI group",
    tags: ["AI", "Engineer"],
  },
};

function scrapeContact(name: string): { headline: string; tags: string[] } {
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  return (
    CONTACT_TABLE[firstName] ?? {
      headline: "Founder · Building something interesting",
      tags: ["Founder", "Network"],
    }
  );
}

function canonicalizePitch(topic: string): PitchPayload {
  const t = topic.toLowerCase();
  if (t.includes("zerodha") || t.includes("nithin")) {
    return {
      topic,
      wins: [
        "Founder mentioned the vision resonated",
        "Positive on the distribution story",
      ],
      objections: [
        "Timing — waiting for Q3 revenue proof",
        "Wants to see one more flagship customer",
      ],
      next: [
        "Share two case studies by Friday",
        "Re-engage in 5 weeks with revenue update",
      ],
    };
  }
  return {
    topic,
    wins: [
      "Strong response to the product demo",
      "Team composition was well-received",
    ],
    objections: [
      "Pricing questioned vs. existing tools",
      "Asked about enterprise security posture",
    ],
    next: [
      "Send pricing tiers and SOC2 deck tomorrow",
      "Schedule security deep-dive with CTO",
    ],
  };
}

function buildFollowup(deal: string): FollowupPayload {
  const lower = deal.toLowerCase();
  const knownContacts: Record<string, { contactName: string; company: string }> = {
    zerodha: { contactName: "Nithin", company: "Zerodha" },
    acme: { contactName: "Sarah", company: "Acme" },
  };
  const matched = Object.keys(knownContacts).find((k) => lower.includes(k));
  const resolved = matched
    ? knownContacts[matched]
    : { contactName: deal.split(/\s+/)[0] || "there", company: deal };
  const body = `Hi ${resolved.contactName}, circling back on our last conversation about ${resolved.company}. A few things have shifted on our end and I'd love 15 minutes to share an update. Does next week work?`;
  return { deal, contactName: resolved.contactName, company: resolved.company, body };
}

function fadingContacts(): FadePayload {
  return {
    contacts: [
      {
        name: "Priya Shah",
        context: "At Nasscom 10xC · Bengaluru — now",
        liveEvent: true,
      },
      { name: "Rohit M.", context: "27 days silent", liveEvent: false },
      { name: "Ananya K.", context: "41 days silent", liveEvent: false },
    ],
  };
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickString(
  args: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const v = args[key];
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

function pickOptString(
  args: Record<string, unknown>,
  key: string
): string | null {
  const v = args[key];
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function pickNumber(
  args: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const v = args[key];
  return typeof v === "number" && isFinite(v) && v > 0 ? v : fallback;
}

export function runTool(
  name: string,
  args: Record<string, unknown>
): CardEvent | null {
  switch (name) {
    case "add_todo":
      return {
        id: genId("todo"),
        type: "todo",
        payload: {
          title: pickString(args, "title", "Untitled"),
          due: pickOptString(args, "due"),
        },
      };
    case "add_win":
      return {
        id: genId("win"),
        type: "win",
        payload: { text: pickString(args, "text", "Nice one.") },
      };
    case "add_contact": {
      const name = pickString(args, "name", "New contact");
      const scraped = scrapeContact(name);
      return {
        id: genId("contact"),
        type: "contact",
        payload: {
          name,
          role: pickOptString(args, "role"),
          company: pickOptString(args, "company"),
          metAt: pickOptString(args, "met_at"),
          headline: scraped.headline,
          tags: scraped.tags,
        },
      };
    }
    case "draft_email":
      return {
        id: genId("email"),
        type: "email",
        payload: {
          to: pickString(args, "to", "them"),
          subject: pickString(args, "subject", "Quick note"),
          body: pickString(args, "body", "Following up on our conversation."),
        },
      };
    case "log_food": {
      const item = pickString(args, "item", "snack");
      const qty = pickNumber(args, "qty", 1);
      return {
        id: genId("food"),
        type: "food",
        payload: { item, qty, kcal: lookupCalories(item, qty) },
      };
    }
    case "analyze_pitch": {
      const topic = pickString(args, "topic", "your last pitch");
      return { id: genId("pitch"), type: "pitch", payload: canonicalizePitch(topic) };
    }
    case "followup_deal": {
      const deal = pickString(args, "deal", "that conversation");
      return { id: genId("followup"), type: "followup", payload: buildFollowup(deal) };
    }
    case "show_fading_contacts":
      return { id: genId("fade"), type: "fade", payload: fadingContacts() };
    default:
      return null;
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `src/lib/mira/tools.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mira/tools.ts
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Add MIRA tool schema and mock handlers"
```

---

## Task 2: Update MIRA system prompt

**Files:**
- Modify: `src/lib/mira/prompt.ts`

Current content:

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

- [ ] **Step 1: Append tool-usage paragraph**

Replace the template literal content in `src/lib/mira/prompt.ts` with the version below (same prefix, two new paragraphs added before the final "Never mention" sentence):

```ts
export const MIRA_PROMPT = `You are MIRA, Synapse's proactive relationship assistant.

Your role is to help people remember who matters and when to reach out. You know their network and habits once connected, but this is a live voice demo, so you don't have access to the user's real contacts yet.

Voice and style:
- Warm, calm, and brief — 1 to 2 sentences unless the user asks you to go deeper.
- Speak at a natural human pace. No filler words. No over-explaining.
- Acknowledge limits gracefully when asked things you can't do in this demo.

If the user asks what you can do, describe your role in one sentence and offer one concrete example from their future life with Synapse (e.g., "Before a coffee next week, I'll surface what you last talked about and anything they've shared publicly since.").

Whenever the user mentions something you can capture or act on — a task or reminder, a win they had, a new person they met, an email they want to send, food or a meal they ate, a pitch or call they want analyzed, a deal that did not close, or a question about who they are losing touch with — silently call the matching tool with the details you heard. Prefer calling a tool over asking clarifying questions. Fill in optional arguments when you are confident; leave them out otherwise. For draft_email, compose a short professional body yourself — do not ask the user to dictate it.

After a tool call, reply in one short natural sentence that confirms the action without naming the tool. Good: "Got it, added that for Priya." Bad: "I've called the add_todo function." Never mention "tool", "function", "calling", "JSON", or technical plumbing. Speak like a human chief of staff who just wrote it down on paper.

Never mention you are running on OpenAI or Realtime. You are MIRA.`;

export const MIRA_MODEL = "gpt-realtime";
export const MIRA_VOICE = "sage" as const;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `src/lib/mira/prompt.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mira/prompt.ts
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Teach MIRA to silently call tools and confirm in one sentence"
```

---

## Task 3: Include tools in Realtime session body

**Files:**
- Modify: `src/app/api/realtime/session/route.ts`

- [ ] **Step 1: Import MIRA_TOOLS and add to upstream body**

Open `src/app/api/realtime/session/route.ts`. Near the top, add the import:

```ts
import { MIRA_TOOLS } from "@/lib/mira/tools";
```

Then find the `body: JSON.stringify({ ... })` payload in the `fetch(...)` to `https://api.openai.com/v1/realtime/sessions` and add a `tools` field so the full body becomes:

```ts
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
```

Do not remove or change any existing fields.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the modified file.

- [ ] **Step 4: Smoke the endpoint**

Run:
```bash
curl -s -X POST http://localhost:3001/api/realtime/session | jq '.client_secret.value, .model, .voice'
```

Expected: an `"ek_..."` token string, `"gpt-realtime"`, `"sage"`. If the port isn't 3001, find the running Synapse dev port with `lsof -i TCP -P | grep LISTEN | grep node` and use that.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/realtime/session/route.ts
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Register MIRA_TOOLS on Realtime session"
```

---

## Task 4: Sparkle burst component

**Files:**
- Create: `src/components/preview/mira-sparkle.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/preview/mira-sparkle.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  count?: number;
  distance?: number;
  duration?: number;
  size?: number;
};

export function MiraSparkle({
  count = 8,
  distance = 40,
  duration = 600,
  size = 3,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    const children = host.children;
    for (let i = 0; i < children.length; i++) {
      const angle = (i / children.length) * Math.PI * 2 + Math.random() * 0.4;
      const d = distance + Math.random() * 12;
      const dx = Math.cos(angle) * d;
      const dy = Math.sin(angle) * d;
      (children[i] as HTMLElement).animate(
        [
          { transform: "translate(0, 0)", opacity: 0.9 },
          { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, opacity: 0 },
        ],
        { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
    }
  }, [count, distance, duration]);

  const dots = Array.from({ length: count });
  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-2 right-2"
      style={{ width: 0, height: 0 }}
    >
      {dots.map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#1A1A1A",
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-sparkle.tsx
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Add MiraSparkle particle burst primitive"
```

---

## Task 5: MiraCard component with variants

**Files:**
- Create: `src/components/preview/mira-card.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/preview/mira-card.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { CardEvent } from "@/lib/mira/tools";
import { MiraSparkle } from "@/components/preview/mira-sparkle";

type Props = { event: CardEvent };

const TYPE_ICON: Record<CardEvent["type"], string> = {
  todo: "📋",
  win: "✨",
  contact: "👤",
  email: "✉️",
  food: "🍛",
  pitch: "🎯",
  followup: "🔁",
  fade: "📉",
};

const TYPE_LABEL: Record<CardEvent["type"], string> = {
  todo: "Todo added",
  win: "Win captured",
  contact: "Contact added",
  email: "Draft ready",
  food: "Logged",
  pitch: "Pitch summary",
  followup: "Follow-up drafted",
  fade: "Reconnect",
};

export function MiraCard({ event }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: "ease-out",
          fill: "forwards",
        });
        return;
      }
    }
    el.animate(
      [
        { opacity: 0, transform: "translateY(12px) scale(0.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );
  }, [event.id]);

  return (
    <div
      ref={ref}
      className="relative w-full rounded-xl border border-[#E5E5E3] bg-white shadow-sm px-4 py-3 opacity-0"
      style={{ willChange: "transform, opacity" }}
    >
      <MiraSparkle />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[15px] leading-none">{TYPE_ICON[event.type]}</span>
        <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-[#AAAAAA]">
          {TYPE_LABEL[event.type]}
        </span>
      </div>
      <Body event={event} />
    </div>
  );
}

function Body({ event }: { event: CardEvent }) {
  switch (event.type) {
    case "todo":
      return (
        <>
          <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.5]">
            {event.payload.title}
          </p>
          {event.payload.due && (
            <span className="inline-block mt-2 text-[11px] font-sans text-[#888888] bg-[#F5F5F3] rounded-full px-2 py-0.5">
              {event.payload.due}
            </span>
          )}
        </>
      );
    case "win":
      return (
        <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.5]">
          {event.payload.text}
        </p>
      );
    case "contact": {
      const { name, role, company, headline, tags } = event.payload;
      const subtitle = [role, company].filter(Boolean).join(" · ");
      return (
        <>
          <p className="text-[15px] font-sans font-medium text-[#1A1A1A] leading-[1.3]">
            {name}
          </p>
          {subtitle && (
            <p className="text-[12px] font-sans text-[#888888] mt-0.5">{subtitle}</p>
          )}
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.5]">
            {headline}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[11px] font-sans text-[#1A1A1A] bg-[#F5F5F3] rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        </>
      );
    }
    case "email": {
      const { to, subject, body } = event.payload;
      return (
        <>
          <p className="text-[12px] font-sans text-[#888888]">
            To <span className="text-[#1A1A1A]">{to}</span>
          </p>
          <p className="text-[14px] font-sans font-medium text-[#1A1A1A] mt-1">
            {subject}
          </p>
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.6] line-clamp-3">
            {body}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-sans text-[#888888]">
            Review →
          </div>
        </>
      );
    }
    case "food": {
      const { item, qty, kcal } = event.payload;
      return (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[14px] font-sans text-[#1A1A1A] leading-[1.3]">
              {qty > 1 ? `${qty} × ${item}` : item}
            </p>
            <p className="text-[11px] font-sans text-[#888888] mt-0.5">
              ~{kcal} kcal
            </p>
          </div>
          <p className="text-[20px] font-serif text-[#1A1A1A] leading-none">
            {kcal}
          </p>
        </div>
      );
    }
    case "pitch": {
      const { topic, wins, objections, next } = event.payload;
      const Section = ({ label, items }: { label: string; items: string[] }) => (
        <div className="mt-2">
          <p className="text-[10px] font-sans uppercase tracking-[0.08em] text-[#AAAAAA] mb-1">
            {label}
          </p>
          <ul className="text-[12px] font-sans text-[#1A1A1A] leading-[1.5] list-disc pl-4 marker:text-[#AAAAAA]">
            {items.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      );
      return (
        <>
          <p className="text-[12px] font-sans text-[#888888]">{topic}</p>
          <Section label="Wins" items={wins} />
          <Section label="Objections" items={objections} />
          <Section label="Next" items={next} />
        </>
      );
    }
    case "followup": {
      const { contactName, company, body } = event.payload;
      return (
        <>
          <p className="text-[14px] font-sans text-[#1A1A1A]">
            {contactName}
            <span className="text-[#888888]"> · {company}</span>
          </p>
          <p className="text-[12px] font-sans text-[#888888] mt-2 leading-[1.6] line-clamp-3">
            {body}
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-sans text-[#888888]">
            Send →
          </div>
        </>
      );
    }
    case "fade":
      return (
        <ul className="flex flex-col gap-2 mt-0.5">
          {event.payload.contacts.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-sans text-[#1A1A1A] truncate">
                  {c.name}
                </p>
                <p className="text-[11px] font-sans text-[#888888] truncate">
                  {c.context}
                </p>
              </div>
              {c.liveEvent && (
                <span className="shrink-0 text-[11px] font-sans font-medium text-white bg-[#1A1A1A] rounded-full px-2.5 py-0.5">
                  Call
                </span>
              )}
            </li>
          ))}
        </ul>
      );
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-card.tsx
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Add MiraCard with 8 variant bodies"
```

---

## Task 6: MiraPanel stack

**Files:**
- Create: `src/components/preview/mira-panel.tsx`

- [ ] **Step 1: Create the panel**

Create `src/components/preview/mira-panel.tsx`:

```tsx
"use client";

import type { CardEvent } from "@/lib/mira/tools";
import { MiraCard } from "@/components/preview/mira-card";

type Props = {
  cards: CardEvent[];
  maxVisible?: number;
};

export function MiraPanel({ cards, maxVisible = 5 }: Props) {
  const visible = cards.slice(-maxVisible);
  return (
    <aside
      aria-label="MIRA actions"
      className="w-full lg:w-[320px] lg:max-w-[320px] flex flex-col gap-3"
    >
      {visible.length === 0 ? null : (
        visible
          .slice()
          .reverse()
          .map((event) => <MiraCard key={event.id} event={event} />)
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-panel.tsx
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Add MiraPanel card stack"
```

---

## Task 7: Extend `useMiraSession` to handle function-call events and expose cards

**Files:**
- Modify: `src/components/preview/mira-session.ts`

The existing hook handles `response.audio_transcript.delta`, `response.audio_transcript.done`, and `conversation.item.input_audio_transcription.completed`. We need to:
1. Import `runTool` and `CardEvent` from `@/lib/mira/tools`.
2. Add a `cards: CardEvent[]` state and `clearCards` callback.
3. Handle `response.function_call_arguments.done` in `handleEvent`.
4. Clear cards when `end()` is called.
5. Return `cards` and `clearCards` from the hook.

- [ ] **Step 1: Apply the edits**

At the top of `src/components/preview/mira-session.ts`, immediately below the existing `import { useCallback, useEffect, useRef, useState } from "react";` line, add:

```ts
import type { CardEvent } from "@/lib/mira/tools";
import { runTool } from "@/lib/mira/tools";
```

Inside the `useMiraSession` function body, near the other `useState` calls (under `const [transcript, setTranscript] = useState<TranscriptLine[]>([]);`), add:

```ts
const [cards, setCards] = useState<CardEvent[]>([]);
```

Add an `appendCard` callback near the other `useCallback` definitions (place it right after `const finalizeMira = useCallback(...)` block):

```ts
const appendCard = useCallback((card: CardEvent) => {
  setCards((prev) => {
    const next = [...prev, card];
    return next.slice(-12);
  });
}, []);

const clearCards = useCallback(() => {
  setCards([]);
}, []);
```

Inside the existing `handleEvent` function, before the final implicit return, add a new branch for function-call completion. Replace the existing `handleEvent` body with the one below (only the bottom `if` block is new; the three existing branches are unchanged):

```ts
const handleEvent = useCallback(
  (raw: string) => {
    let ev: {
      type?: string;
      transcript?: string;
      delta?: string;
      name?: string;
      arguments?: string;
      call_id?: string;
    };
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

    if (
      ev.type === "response.function_call_arguments.done" &&
      typeof ev.name === "string" &&
      typeof ev.arguments === "string"
    ) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(ev.arguments) as Record<string, unknown>;
      } catch {
        return;
      }
      const card = runTool(ev.name, parsed);
      if (card) appendCard(card);
      return;
    }
  },
  [appendLine, updateMiraPartial, finalizeMira, appendCard]
);
```

Inside the existing `end` callback, clear the cards too. Replace the body of `end` with:

```ts
const end = useCallback(() => {
  setStatus("ending");
  teardown();
  clearCards();
  setStatus("idle");
}, [teardown, clearCards]);
```

Inside the existing 5-minute auto-end timeout inside `start` (the `setTimeout(() => { setStatus("ending"); teardown(); setStatus("idle"); }, MAX_SESSION_MS)` block), also clear cards. Replace that timeout callback body with:

```ts
endTimerRef.current = window.setTimeout(() => {
  setStatus("ending");
  teardown();
  clearCards();
  setStatus("idle");
}, MAX_SESSION_MS);
```

Then update `start`'s `useCallback` dependency array to include `clearCards`. Find the closing `}, [ ... ]);` of the `start = useCallback(...)` definition and ensure `clearCards` is in that array (preserve the existing entries and add `clearCards` at the end).

Finally, update the hook's return statement to include `cards` and `clearCards`. Replace the existing `return { ... }` block at the bottom of `useMiraSession` with:

```ts
return {
  status,
  muted,
  transcript,
  cards,
  userAmpRef,
  modelAmpRef,
  start,
  end,
  toggleMute,
  clearCards,
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the modified file.

- [ ] **Step 4: Commit**

```bash
git add src/components/preview/mira-session.ts
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Surface function-call cards from useMiraSession"
```

---

## Task 8: Mount `<MiraPanel />` on /preview

**Files:**
- Modify: `src/app/(marketing)/preview/page.tsx`

Current layout: single-column, centered. We need to make it two-column on lg+ (orb + captions + controls on the left; MiraPanel on the right). On smaller viewports, the panel appears below the controls as a vertical stack.

- [ ] **Step 1: Update imports**

Open `src/app/(marketing)/preview/page.tsx`. Add this import near the other component imports:

```ts
import { MiraPanel } from "@/components/preview/mira-panel";
```

- [ ] **Step 2: Destructure `cards` from the hook**

In the `PreviewPage` component body, update the destructuring from `useMiraSession()` to include `cards`. Replace:

```ts
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
```

with:

```ts
const {
  status,
  muted,
  transcript,
  cards,
  userAmpRef,
  modelAmpRef,
  start,
  end,
  toggleMute,
} = useMiraSession();
```

- [ ] **Step 3: Restructure the layout so the panel lives beside the orb**

Replace the root `return ( ... )` JSX of `PreviewPage` with the following (everything before `return` stays the same):

```tsx
return (
  <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 pt-[6vh] pb-24">
    <div className="flex-1 flex flex-col items-center text-center min-w-0">
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

    <div className="mt-10 lg:mt-0 lg:pt-[calc(6vh+56px)] w-full lg:w-auto">
      <MiraPanel cards={cards} />
    </div>
  </div>
);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors for the modified file.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(marketing)/preview/page.tsx'
git -c user.name="Karthik Nagapuri" -c user.email="19h61a3538@cvsr.ac.in" commit -m "Mount MiraPanel alongside the orb on /preview"
```

---

## Task 9: Scripted manual smoke test

This is a controller task (not a subagent task). Verify the demo works end-to-end.

- [ ] **Step 1: Ensure dev server is reachable**

Run: `curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3001/preview`
Expected: `HTTP 200`. If not, find the port with `lsof -iTCP -sTCP:LISTEN -Pn | grep node` and substitute.

- [ ] **Step 2: Open `/preview` in Chrome with mic access granted**

Click **Start conversation**, grant mic.

- [ ] **Step 3: Say each of these sentences and confirm the matching card appears**

Wait for MIRA to respond between each sentence.

| # | Say | Expect |
|---|---|---|
| 1 | "Remind me to send Priya the pitch deck at 5pm." | 📋 Todo card: "Send Priya the pitch deck" with `5pm` chip. |
| 2 | "I closed the Acme deal today." | ✨ Win card: "Closed the Acme deal today." |
| 3 | "I just met Rohan, he's the founder at FinX." | 👤 Contact card: name=Rohan, role=Founder, company=FinX, scraped headline + 2 tags. |
| 4 | "Email Sarah about the partnership — let her know we're interested." | ✉️ Email card: To=Sarah, subject present, 3-line body preview. |
| 5 | "I had one biryani for lunch." | 🍛 Food card: `biryani`, 850 kcal. |
| 6 | "How did my last Zerodha pitch go?" | 🎯 Pitch card: wins/objections/next sections (Zerodha variant). |
| 7 | "The Zerodha deal didn't close." | 🔁 Followup card: Nithin · Zerodha + 2-line draft. |
| 8 | "Who am I losing touch with?" | 📉 Fade card: Priya (with `Call` chip), Rohit, Ananya. |

- [ ] **Step 4: Verify panel behavior**

- All 8 cards visible? Panel should clip to 5 most recent. Oldest should be gone after card 6+.
- Sparkle burst plays on each card entry.
- MIRA speaks a short natural confirmation after each tool call — no technical language.

- [ ] **Step 5: Hit End, confirm panel clears**

Click **End**. Cards panel should clear to empty. Orb returns to idle. Click **Start again** and verify a clean session.

- [ ] **Step 6: Commit the smoke-test checklist as a doc update (optional)**

No action needed here unless you discover a defect. If MIRA consistently fails to call a tool for a sentence above, tighten the tool's `description` in `src/lib/mira/tools.ts` (Task 1) and re-run.

---

## Final verification

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: success; `/preview` in the route list; no prerender errors on routes we touched.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: no new errors attributable to the 8 new/modified files above.
