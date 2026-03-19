import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STAGE_PRESETS: Record<string, string[]> = {
  fundraising: ["Identified", "Intro Sent", "Meeting", "Due Diligence", "Term Sheet", "Closed"],
  hiring: ["Sourced", "Screening", "Interview", "Offer", "Hired"],
  sales: ["Lead", "Qualified", "Proposal", "Negotiation", "Won"],
  custom: ["To Do", "In Progress", "Done"],
};

const STAGE_COLORS = ["#6B7280", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444"];

// GET /api/pipelines — list all pipelines for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pipelines, error } = await supabase
      .from("pipelines")
      .select(`
        *,
        pipeline_stages (
          id,
          name,
          position,
          color,
          pipeline_cards ( id )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = (pipelines ?? []).map((p) => {
      const stages = p.pipeline_stages || [];
      const cardCount = stages.reduce(
        (sum: number, s: { pipeline_cards?: { id: string }[] }) =>
          sum + (s.pipeline_cards?.length ?? 0),
        0
      );
      return {
        ...p,
        stage_count: stages.length,
        card_count: cardCount,
      };
    });

    return NextResponse.json({ pipelines: enriched });
  } catch (error) {
    console.error("Pipelines list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/pipelines — create a new pipeline with default stages
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const pipelineType = type && STAGE_PRESETS[type] ? type : "custom";

    // Create the pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .insert({
        user_id: user.id,
        name: name.trim(),
        type: pipelineType,
        description: description?.trim() || null,
      })
      .select("*")
      .single();

    if (pipelineError) {
      return NextResponse.json(
        { error: pipelineError.message },
        { status: 500 }
      );
    }

    // Create default stages
    const stageNames = STAGE_PRESETS[pipelineType];
    const stages = stageNames.map((stageName, index) => ({
      pipeline_id: pipeline.id,
      name: stageName,
      position: index,
      color: STAGE_COLORS[index % STAGE_COLORS.length],
    }));

    const { data: createdStages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .insert(stages)
      .select("*");

    if (stagesError) {
      return NextResponse.json(
        { error: stagesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        pipeline: {
          ...pipeline,
          stages: createdStages,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pipeline create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
