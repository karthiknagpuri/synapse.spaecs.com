import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, generateContactEmbeddingText } from "@/lib/openai";
import crypto from "crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contacts } = await supabase
      .from("contacts")
      .select(
        `
        id, full_name, company, title, location, bio, tags,
        interactions (subject, snippet),
        contact_embeddings (content_hash)
      `
      )
      .eq("user_id", user.id)
      .limit(100);

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ message: "No contacts to embed", embedded: 0 });
    }

    let embedded = 0;

    for (const contact of contacts) {
      const text = generateContactEmbeddingText({
        full_name: contact.full_name,
        company: contact.company,
        title: contact.title,
        location: contact.location,
        bio: contact.bio,
        tags: contact.tags,
        interactions: contact.interactions || [],
      });

      const contentHash = crypto
        .createHash("md5")
        .update(text)
        .digest("hex");

      const existingHash = (contact.contact_embeddings as any)?.[0]?.content_hash;
      if (existingHash === contentHash) continue;

      const embedding = await generateEmbedding(text);

      await supabase.from("contact_embeddings").upsert(
        {
          contact_id: contact.id,
          user_id: user.id,
          embedding: JSON.stringify(embedding),
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "contact_id" }
      );

      embedded++;
    }

    return NextResponse.json({ success: true, embedded });
  } catch (err: any) {
    console.error("Embedding error:", err);
    return NextResponse.json(
      { error: err.message || "Embedding failed" },
      { status: 500 }
    );
  }
}
