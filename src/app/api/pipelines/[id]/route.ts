import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/pipelines/:id — get pipeline with all stages and cards (cards joined with contacts)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .select(`
        *,
        pipeline_stages (
          id,
          name,
          position,
          color,
          created_at,
          pipeline_cards (
            id,
            stage_id,
            contact_id,
            user_id,
            position,
            notes,
            created_at,
            updated_at,
            contacts (
              id,
              full_name,
              email,
              company,
              title,
              avatar_url,
              location
            )
          )
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Pipeline not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort stages by position, sort cards within each stage by position
    if (pipeline.pipeline_stages) {
      pipeline.pipeline_stages.sort(
        (a: { position: number }, b: { position: number }) =>
          a.position - b.position
      );
      pipeline.pipeline_stages.forEach(
        (stage: { pipeline_cards?: { position: number; contacts?: unknown; contact?: unknown }[] }) => {
          if (stage.pipeline_cards) {
            stage.pipeline_cards.sort(
              (a: { position: number }, b: { position: number }) =>
                a.position - b.position
            );
            // Flatten contact from array to object (Supabase returns nested as array)
            stage.pipeline_cards = stage.pipeline_cards.map((card) => ({
              ...card,
              contact: Array.isArray(card.contacts)
                ? card.contacts[0] || null
                : card.contacts || null,
              contacts: undefined,
            }));
          }
        }
      );
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error("Pipeline get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/pipelines/:id — update pipeline name/description
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, string | null> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: pipeline, error } = await supabase
      .from("pipelines")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error("Pipeline update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/pipelines/:id — delete a pipeline (cascades to stages and cards)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("pipelines")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pipeline delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
