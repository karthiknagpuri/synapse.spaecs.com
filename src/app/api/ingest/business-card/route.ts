import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractBusinessCard } from "@/lib/business-card";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { image } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 }
    );
  }

  try {
    const data = await extractBusinessCard(image);

    if (!data.full_name && !data.email) {
      return NextResponse.json(
        { error: "Could not extract contact information from this image. Please try a clearer photo." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Business card extraction failed:", error);
    return NextResponse.json(
      { error: "Failed to process business card. Please try again." },
      { status: 500 }
    );
  }
}
