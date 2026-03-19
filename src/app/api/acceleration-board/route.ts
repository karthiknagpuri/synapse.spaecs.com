import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await supabase
    .from("acceleration_board")
    .select("*, contact:contacts(*)")
    .eq("user_id", user.id);

  const assignments = (rows || []).map((row) => ({
    role: row.role,
    contact_id: row.contact_id,
    contact: row.contact,
    display_name: row.display_name,
    description: row.description,
    category: row.category,
  }));

  return NextResponse.json({ assignments });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { role, contact_id, display_name, description, category } = body;

  if (!role || !contact_id) {
    return NextResponse.json(
      { error: "role and contact_id are required" },
      { status: 400 }
    );
  }

  // Upsert: one contact per role per user
  const { data: existing } = await supabase
    .from("acceleration_board")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .single();

  if (existing) {
    await supabase
      .from("acceleration_board")
      .update({
        contact_id,
        display_name: display_name || null,
        description: description || null,
        category: category || "expert",
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("acceleration_board").insert({
      user_id: user.id,
      role,
      contact_id,
      display_name: display_name || null,
      description: description || null,
      category: category || "expert",
    });
  }

  // Fetch the full assignment with contact data
  const { data: row } = await supabase
    .from("acceleration_board")
    .select("*, contact:contacts(*)")
    .eq("user_id", user.id)
    .eq("role", role)
    .single();

  return NextResponse.json({
    assignment: {
      role: row?.role,
      contact_id: row?.contact_id,
      contact: row?.contact,
      display_name: row?.display_name,
      description: row?.description,
      category: row?.category,
    },
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { role } = body;

  if (!role) {
    return NextResponse.json(
      { error: "role is required" },
      { status: 400 }
    );
  }

  await supabase
    .from("acceleration_board")
    .delete()
    .eq("user_id", user.id)
    .eq("role", role);

  return NextResponse.json({ success: true });
}
