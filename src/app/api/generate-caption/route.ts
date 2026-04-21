import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: generate a simple caption from the prompt
      const words = prompt.split(" ").slice(0, 8).join(" ");
      return NextResponse.json({ caption: `✨ ${words}` });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah copywriter konten sosial media Indonesia. Buat caption pendek (maksimal 12 kata) yang catchy, viral, dan sesuai dengan deskripsi visual. Gunakan emoji yang relevan. Hanya kembalikan caption, tanpa penjelasan.",
          },
          {
            role: "user",
            content: `Buat caption untuk konten ini: ${prompt}`,
          },
        ],
        max_tokens: 60,
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const fallback = prompt.split(" ").slice(0, 8).join(" ");
      return NextResponse.json({ caption: `✨ ${fallback}` });
    }

    const caption = data.choices?.[0]?.message?.content?.trim() || `✨ ${prompt.slice(0, 60)}`;
    return NextResponse.json({ caption });
  } catch {
    const fallback = "✨ Konten eksklusif bertenaga AI";
    return NextResponse.json({ caption: fallback });
  }
}
