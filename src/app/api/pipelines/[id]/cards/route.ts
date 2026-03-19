import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/pipelines/:id/cards — add a contact to a pipeline stage
export async function POST(
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
    const { stage_id, contact_id } = body;

    if (!stage_id || !contact_id) {
      return NextResponse.json(
        { error: "stage_id and contact_id are required" },
        { status: 400 }
      );
    }

    // Verify the stage belongs to this pipeline and user owns the pipeline
    const { data: stage, error: stageError } = await supabase
      .from("pipeline_stages")
      .select("id, pipeline_id")
      .eq("id", stage_id)
      .single();

    if (stageError || !stage || stage.pipeline_id !== id) {
      return NextResponse.json(
        { error: "Stage not found in this pipeline" },
        { status: 404 }
      );
    }

    // Check if contact is already in this pipeline (any stage)
    const { data: existingCards } = await supabase
      .from("pipeline_cards")
      .select("id, stage_id")
      .eq("contact_id", contact_id)
      .eq("user_id", user.id)
      .in(
        "stage_id",
        (
          await supabase
            .from("pipeline_stages")
            .select("id")
            .eq("pipeline_id", id)
        ).data?.map((s: { id: string }) => s.id) ?? []
      );

    if (existingCards && existingCards.length > 0) {
      return NextResponse.json(
        { error: "Contact is already in this pipeline" },
        { status: 409 }
      );
    }

    // Get max position in the stage
    const { data: maxPosCards } = await supabase
      .from("pipeline_cards")
      .select("position")
      .eq("stage_id", stage_id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      maxPosCards && maxPosCards.length > 0 ? maxPosCards[0].position + 1 : 0;

    // Create the card
    const { data: card, error: cardError } = await supabase
      .from("pipeline_cards")
      .insert({
        stage_id,
        contact_id,
        user_id: user.id,
        position: nextPosition,
        notes: null,
      })
      .select(`
        *,
        contacts (
          id,
          full_name,
          email,
          company,
          title,
          avatar_url,
          location
        )
      `)
      .single();

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    // Flatten contact
    const result = {
      ...card,
      contact: Array.isArray(card.contacts)
        ? card.contacts[0] || null
        : card.contacts || null,
      contacts: undefined,
    };

    return NextResponse.json({ card: result }, { status: 201 });
  } catch (error) {
    console.error("Card create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/pipelines/:id/cards — move a card to a new stage or reorder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    void id; // pipeline id used for route context
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { card_id, stage_id, position } = body;

    if (!card_id || !stage_id || position === undefined) {
      return NextResponse.json(
        { error: "card_id, stage_id, and position are required" },
        { status: 400 }
      );
    }

    // Update the card's stage and position
    const { data: card, error } = await supabase
      .from("pipeline_cards")
      .update({
        stage_id,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card_id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Card move error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/pipelines/:id/cards — remove a card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    void id;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const card_id = searchParams.get("card_id");

    if (!card_id) {
      return NextResponse.json(
        { error: "card_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pipeline_cards")
      .delete()
      .eq("id", card_id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Card delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
