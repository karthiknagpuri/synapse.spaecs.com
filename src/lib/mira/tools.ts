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
