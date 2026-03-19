import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ─── Role definitions with keyword matching ─── */
const ROLE_DEFS = [
  {
    id: "investors",
    label: "Investors",
    keywords: [
      "investor", "vc", "venture", "angel", "capital", "fund",
      "partner at", "managing partner", "general partner", "lp",
      "portfolio", "seed", "series a", "series b", "fundrais",
    ],
  },
  {
    id: "founders",
    label: "Founders",
    keywords: [
      "founder", "co-founder", "cofounder", "ceo", "chief executive",
      "started", "built", "building", "bootstrapped", "serial entrepreneur",
    ],
  },
  {
    id: "engineers",
    label: "Engineers",
    keywords: [
      "engineer", "developer", "software", "frontend", "backend",
      "full stack", "fullstack", "full-stack", "swe", "sde",
      "devops", "infrastructure", "platform engineer", "staff engineer",
      "principal engineer", "tech lead",
    ],
  },
  {
    id: "designers",
    label: "Designers",
    keywords: [
      "designer", "design", "ux", "ui", "product design", "brand",
      "creative director", "art director", "visual", "graphic",
    ],
  },
  {
    id: "marketers",
    label: "Marketers",
    keywords: [
      "marketing", "growth", "cmo", "content", "seo", "paid",
      "demand gen", "brand manager", "social media", "community",
      "head of growth", "vp marketing", "acquisition",
    ],
  },
  {
    id: "sales",
    label: "Sales",
    keywords: [
      "sales", "account executive", "ae", "sdr", "bdr",
      "business development", "revenue", "cro", "deal",
      "partnerships", "head of sales", "vp sales",
    ],
  },
  {
    id: "product",
    label: "Product",
    keywords: [
      "product manager", "product lead", "pm", "cpo",
      "head of product", "vp product", "product owner",
      "product strategy",
    ],
  },
  {
    id: "creators",
    label: "Creators",
    keywords: [
      "creator", "youtuber", "influencer", "podcaster", "writer",
      "author", "blogger", "journalist", "newsletter", "streamer",
      "content creator",
    ],
  },
  {
    id: "advisors",
    label: "Advisors",
    keywords: [
      "advisor", "consultant", "mentor", "coach", "board member",
      "strategic advisor", "fractional", "advisory",
    ],
  },
  {
    id: "operators",
    label: "Operators",
    keywords: [
      "coo", "operations", "chief of staff", "head of ops",
      "vp operations", "program manager", "project manager",
    ],
  },
];

function classifyContact(
  title: string | null,
  bio: string | null,
  tags: string[]
): string[] {
  const text = [title, bio, ...tags].filter(Boolean).join(" ").toLowerCase();
  const matched: string[] = [];

  for (const role of ROLE_DEFS) {
    for (const kw of role.keywords) {
      if (text.includes(kw)) {
        matched.push(role.id);
        break;
      }
    }
  }

  return matched;
}

// GET /api/contacts/featured — role-based breakdown of the user's network
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, title, bio, avatar_url, tags, company, relationship_score")
    .eq("user_id", user.id)
    .order("relationship_score", { ascending: false });

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ roles: [] });
  }

  // Build role → contacts map
  const roleMap: Record<string, { count: number; avatars: string[]; names: string[] }> = {};

  for (const c of contacts) {
    const roles = classifyContact(c.title, c.bio, c.tags || []);
    for (const roleId of roles) {
      if (!roleMap[roleId]) {
        roleMap[roleId] = { count: 0, avatars: [], names: [] };
      }
      roleMap[roleId].count += 1;
      if (roleMap[roleId].avatars.length < 4) {
        roleMap[roleId].avatars.push(c.avatar_url || "");
      }
      if (roleMap[roleId].names.length < 3) {
        roleMap[roleId].names.push(c.full_name);
      }
    }
  }

  // Build ordered result — only roles with at least 1 contact
  const roles = ROLE_DEFS
    .filter((r) => roleMap[r.id] && roleMap[r.id].count > 0)
    .map((r) => ({
      id: r.id,
      label: r.label,
      count: roleMap[r.id].count,
      avatars: roleMap[r.id].avatars,
      names: roleMap[r.id].names,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ roles, total: contacts.length });
}
