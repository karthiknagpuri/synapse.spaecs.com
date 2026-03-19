import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGoogleAccessToken } from "@/lib/integrations/google-auth";
import { fetchGoogleProfilePhotos } from "@/lib/integrations/people";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .eq("platform", "google")
      .single();

    if (!integration?.refresh_token) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 400 }
      );
    }

    const accessToken = await refreshGoogleAccessToken(integration.refresh_token);

    // Fetch all profile photos from Google People API
    const photoMap = await fetchGoogleProfilePhotos(accessToken);
    console.log(`[Photos] Found ${photoMap.size} photos from Google contacts`);

    if (photoMap.size === 0) {
      return NextResponse.json({
        success: true,
        photos_updated: 0,
        message: "No photos found. You may need to re-authenticate with contacts permission.",
      });
    }

    // Get all contacts for this user that don't have an avatar yet
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, email")
      .eq("user_id", user.id)
      .not("email", "is", null);

    let updated = 0;

    for (const contact of contacts || []) {
      if (!contact.email) continue;
      const photoUrl = photoMap.get(contact.email.toLowerCase());
      if (photoUrl) {
        await supabase
          .from("contacts")
          .update({ avatar_url: photoUrl })
          .eq("id", contact.id);
        updated++;
      }
    }

    console.log(`[Photos] Updated ${updated} contact photos`);

    return NextResponse.json({
      success: true,
      photos_found: photoMap.size,
      photos_updated: updated,
    });
  } catch (err: any) {
    console.error("Photo fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Photo fetch failed" },
      { status: 500 }
    );
  }
}
