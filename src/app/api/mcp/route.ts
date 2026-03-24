import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, supabaseAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-error";
import { generateEmbedding, translateQuery, rerankResults } from "@/lib/openai";
import { runResearchPipeline } from "@/lib/research/engine";

/**
 * MCP (Model Context Protocol) Server — HTTP Transport
 *
 * Exposes Synapse tools for Claude, Cursor, and other AI assistants.
 * Protocol: JSON-RPC 2.0 over HTTP POST
 *
 * Tools:
 *   - search_network: Search your professional network in natural language
 *   - research_person: Research a person and build a detailed profile
 *   - list_contacts: List contacts with optional filters
 *   - get_contact: Get detailed info about a specific contact
 */

const TOOLS = [
  {
    name: "search_network",
    description:
      "Search your professional network using natural language. Find people by role, company, location, skills, or any combination. Returns ranked results with confidence scores.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Natural language search query. Examples: "founders in AI", "designers at startups in NYC", "people I emailed about fundraising"',
        },
      },
      required: ["query"],
    },
  },
  {
    name: "research_person",
    description:
      "Research a person and build a comprehensive profile using AI web agents. Include name, title, company, or social URLs for best results. Returns career history, skills, talking points, and connection paths.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description:
            'Person description. Examples: "Garry Tan, CEO Y Combinator", "Jane Smith, Staff Engineer at OpenAI, @janesmith on Twitter"',
        },
      },
      required: ["description"],
    },
  },
  {
    name: "list_contacts",
    description:
      "List contacts from your network with optional sorting and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of contacts to return (max 50, default 20)",
        },
        offset: { type: "number", description: "Pagination offset (default 0)" },
        sort: {
          type: "string",
          enum: ["full_name", "relationship_score", "last_interaction_at", "company"],
          description: "Sort field (default: relationship_score)",
        },
      },
    },
  },
  {
    name: "get_contact",
    description:
      "Get detailed information about a specific contact including recent interactions.",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "The contact's UUID" },
      },
      required: ["contact_id"],
    },
  },
];

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ("error" in auth) return auth.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(-32700, "Parse error", null);
  }

  const { method, params, id } = body;

  // Handle MCP protocol methods
  switch (method) {
    case "initialize":
      return jsonRpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "synapse-mcp",
          version: "1.0.0",
        },
      });

    case "tools/list":
      return jsonRpcResult(id, { tools: TOOLS });

    case "tools/call":
      return handleToolCall(id, params, auth.user.id);

    case "ping":
      return jsonRpcResult(id, {});

    default:
      return jsonRpcError(-32601, `Method not found: ${method}`, id);
  }
}

async function handleToolCall(rpcId: any, params: any, userId: string) {
  const { name, arguments: args } = params || {};

  switch (name) {
    case "search_network":
      return handleSearch(rpcId, args, userId);
    case "research_person":
      return handleResearch(rpcId, args, userId);
    case "list_contacts":
      return handleListContacts(rpcId, args, userId);
    case "get_contact":
      return handleGetContact(rpcId, args, userId);
    default:
      return jsonRpcError(-32602, `Unknown tool: ${name}`, rpcId);
  }
}

async function handleSearch(rpcId: any, args: any, userId: string) {
  const query = args?.query;
  if (!query) return jsonRpcError(-32602, "query is required", rpcId);

  try {
    const structured = await translateQuery(query);
    const embedding = await generateEmbedding(structured.searchText);

    const { data: results } = await supabaseAdmin.rpc("semantic_search", {
      query_embedding: JSON.stringify(embedding),
      match_user_id: userId,
      match_count: 20,
      filter_location: structured.filters.location || null,
      filter_platform: structured.filters.platform || null,
      filter_after: structured.filters.dateAfter || null,
    });

    const candidates = (results || []).map((r: any) => ({
      contact_id: r.contact_id,
      full_name: r.full_name,
      title: r.title,
      company: r.company,
      location: r.location,
      tags: r.tags,
      bio: r.bio,
      similarity: r.similarity,
    }));

    const ranked = await rerankResults(query, candidates);

    const text = ranked
      .slice(0, 10)
      .map(
        (r, i) =>
          `${i + 1}. **${r.full_name}** — ${r.title || "N/A"} at ${r.company || "N/A"} (${r.location || "N/A"})\n   Score: ${r.weighted_traits_score}/3.0 [${r.confidence}]\n   ID: ${r.contact_id}`
      )
      .join("\n\n");

    return jsonRpcResult(rpcId, {
      content: [
        {
          type: "text",
          text: `Found ${ranked.length} results for "${query}":\n\n${text || "No results found."}`,
        },
      ],
    });
  } catch (err: any) {
    return jsonRpcResult(rpcId, {
      content: [{ type: "text", text: `Search failed: ${err.message}` }],
      isError: true,
    });
  }
}

async function handleResearch(rpcId: any, args: any, userId: string) {
  const description = args?.description;
  if (!description) return jsonRpcError(-32602, "description is required", rpcId);

  try {
    const { data: research } = await supabaseAdmin
      .from("research_profiles")
      .insert({
        user_id: userId,
        query_name: description,
        status: "pending",
      })
      .select("id")
      .single();

    if (!research) throw new Error("Failed to create research job");

    // Run synchronously for MCP (AI assistant will wait)
    await runResearchPipeline(research.id, userId, description);

    // Fetch completed result
    const { data: result } = await supabaseAdmin
      .from("research_profiles")
      .select("profile_data, sources, processing_time_ms")
      .eq("id", research.id)
      .single();

    if (!result?.profile_data) {
      return jsonRpcResult(rpcId, {
        content: [{ type: "text", text: "Research completed but no profile data was generated." }],
      });
    }

    const p = result.profile_data as any;
    const sections = [
      `# ${description}`,
      p.summary && `\n${p.summary}`,
      p.current_role && `\n**Current Role:** ${p.current_role.title} at ${p.current_role.company}\n${p.current_role.description || ""}`,
      p.career_history?.length && `\n**Career:**\n${p.career_history.map((c: any) => `- ${c.title} at ${c.company} (${c.period})`).join("\n")}`,
      p.education?.length && `\n**Education:**\n${p.education.map((e: any) => `- ${e.degree} in ${e.field}, ${e.institution} (${e.year})`).join("\n")}`,
      p.skills?.length && `\n**Skills:** ${p.skills.join(", ")}`,
      p.talking_points?.length && `\n**Talking Points:**\n${p.talking_points.map((t: string) => `- ${t}`).join("\n")}`,
      p.connection_paths?.length && `\n**Connection Paths:**\n${p.connection_paths.map((c: any) => `- ${c.type === "direct" ? "Direct connection" : `Via ${c.via}`} (score: ${c.relationship_score})`).join("\n")}`,
      `\n*Researched in ${Math.round((result.processing_time_ms || 0) / 1000)}s with ${result.sources?.length || 0} sources*`,
    ]
      .filter(Boolean)
      .join("\n");

    return jsonRpcResult(rpcId, {
      content: [{ type: "text", text: sections }],
    });
  } catch (err: any) {
    return jsonRpcResult(rpcId, {
      content: [{ type: "text", text: `Research failed: ${err.message}` }],
      isError: true,
    });
  }
}

async function handleListContacts(rpcId: any, args: any, userId: string) {
  const limit = Math.min(args?.limit || 20, 50);
  const offset = args?.offset || 0;
  const sort = args?.sort || "relationship_score";

  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("id, full_name, email, company, title, location, relationship_score, last_interaction_at")
    .eq("user_id", userId)
    .order(sort, { ascending: sort === "full_name" })
    .range(offset, offset + limit - 1);

  const text = (contacts || [])
    .map(
      (c, i) =>
        `${offset + i + 1}. **${c.full_name}** — ${c.title || "N/A"} at ${c.company || "N/A"} | Score: ${c.relationship_score || 0} | ID: ${c.id}`
    )
    .join("\n");

  return jsonRpcResult(rpcId, {
    content: [
      {
        type: "text",
        text: text || "No contacts found.",
      },
    ],
  });
}

async function handleGetContact(rpcId: any, args: any, userId: string) {
  const contactId = args?.contact_id;
  if (!contactId) return jsonRpcError(-32602, "contact_id is required", rpcId);

  const { data: contact } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  if (!contact) {
    return jsonRpcResult(rpcId, {
      content: [{ type: "text", text: `Contact ${contactId} not found.` }],
      isError: true,
    });
  }

  const { data: interactions } = await supabaseAdmin
    .from("interactions")
    .select("type, platform, subject, occurred_at")
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(10);

  const interactionText = (interactions || [])
    .map(
      (i) =>
        `- ${i.type} via ${i.platform}${i.subject ? `: "${i.subject}"` : ""} (${new Date(i.occurred_at).toLocaleDateString()})`
    )
    .join("\n");

  const text = [
    `# ${contact.full_name}`,
    contact.title && `**Title:** ${contact.title}`,
    contact.company && `**Company:** ${contact.company}`,
    contact.location && `**Location:** ${contact.location}`,
    contact.email && `**Email:** ${contact.email}`,
    contact.bio && `\n${contact.bio}`,
    `\n**Relationship Score:** ${contact.relationship_score || 0}/100`,
    contact.tags?.length && `**Tags:** ${contact.tags.join(", ")}`,
    contact.linkedin_url && `**LinkedIn:** ${contact.linkedin_url}`,
    contact.twitter_handle && `**Twitter:** @${contact.twitter_handle}`,
    interactions?.length && `\n**Recent Interactions:**\n${interactionText}`,
  ]
    .filter(Boolean)
    .join("\n");

  return jsonRpcResult(rpcId, {
    content: [{ type: "text", text }],
  });
}

/* ─── JSON-RPC Helpers ─── */

function jsonRpcResult(id: any, result: any) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function jsonRpcError(code: number, message: string, id: any) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });
}
