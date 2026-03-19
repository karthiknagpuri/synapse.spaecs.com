import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/contacts/search?q=... — simple text search for contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ contacts: [] });
    }

    // Simple ilike search on full_name, email, company
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("id, full_name, email, company, title, avatar_url, location")
      .eq("user_id", user.id)
      .or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`
      )
      .order("full_name")
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts: contacts ?? [] });
  } catch (error) {
    console.error("Contact search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
