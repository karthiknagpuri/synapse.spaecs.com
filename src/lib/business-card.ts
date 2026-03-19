import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BusinessCardData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  website: string | null;
}

export async function extractBusinessCard(
  imageBase64: string
): Promise<BusinessCardData> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract contact information from this business card image. Return JSON with: full_name, email, phone, company, title, location, website. Return null for fields not found. For phone, include country code if visible. For location, combine city/state/country as shown.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all contact information from this business card.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return {
      full_name: null,
      email: null,
      phone: null,
      company: null,
      title: null,
      location: null,
      website: null,
    };
  }

  const parsed = JSON.parse(content);

  return {
    full_name: parsed.full_name || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    company: parsed.company || null,
    title: parsed.title || null,
    location: parsed.location || null,
    website: parsed.website || null,
  };
}
