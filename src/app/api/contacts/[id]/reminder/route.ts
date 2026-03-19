import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FREQUENCY_MAP: Record<string, number> = {
  "1 week": 7,
  "2 weeks": 14,
  "1 month": 30,
  "3 months": 90,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { frequency } = await request.json();

  // Clear reminder if frequency is null or "none"
  if (!frequency || frequency === "none") {
    const { error } = await supabase
      .from("contacts")
      .update({
        reminder_frequency: null,
        next_reminder_at: null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to clear reminder" }, { status: 500 });
    }

    return NextResponse.json({ reminder_frequency: null, next_reminder_at: null });
  }

  const days = FREQUENCY_MAP[frequency];
  if (!days) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }

  const nextReminder = new Date();
  nextReminder.setDate(nextReminder.getDate() + days);

  const { error } = await supabase
    .from("contacts")
    .update({
      reminder_frequency: frequency,
      next_reminder_at: nextReminder.toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to set reminder" }, { status: 500 });
  }

  return NextResponse.json({
    reminder_frequency: frequency,
    next_reminder_at: nextReminder.toISOString(),
  });
}
