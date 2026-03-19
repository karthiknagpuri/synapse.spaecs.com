import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
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

    const { data: research, error } = await supabase
      .from("research_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !research) {
      return NextResponse.json(
        { error: "Research not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(research);
  } catch (error) {
    console.error("Research get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
