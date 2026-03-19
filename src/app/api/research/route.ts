import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runResearchPipeline } from "@/lib/research/engine";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, context, contact_id } = body as {
      name?: string;
      context?: string;
      contact_id?: string;
    };

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required (min 2 characters)" },
        { status: 400 }
      );
    }

    // Create research profile record
    const { data: research, error: insertError } = await supabase
      .from("research_profiles")
      .insert({
        user_id: user.id,
        query_name: name.trim(),
        query_context: context?.trim() || null,
        contact_id: contact_id || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError || !research) {
      console.error("Failed to create research:", insertError);
      return NextResponse.json(
        { error: "Failed to start research" },
        { status: 500 }
      );
    }

    // Fire-and-forget: run the pipeline in the background
    runResearchPipeline(
      research.id,
      user.id,
      name.trim(),
      context?.trim(),
      contact_id
    ).catch((err) => console.error("Research pipeline error:", err));

    return NextResponse.json({
      id: research.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const { data: profiles } = await supabase
      .from("research_profiles")
      .select("id, query_name, query_context, status, processing_time_ms, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ profiles: profiles || [] });
  } catch (error) {
    console.error("Research list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
