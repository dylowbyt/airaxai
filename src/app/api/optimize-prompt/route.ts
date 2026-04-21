import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt diperlukan" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key tidak dikonfigurasi" },
        { status: 500 }
      );
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
            content: `Kamu adalah Professional Prompt Engineer. Tugasmu adalah mengambil ide atau prompt singkat dari user, lalu mengubahnya menjadi prompt tingkat profesional yang sangat detail, spesifik, dan dioptimalkan untuk AI Image/Video Generator (seperti Midjourney, DALL-E, atau Runway).
Aturan:
1. Hanya kembalikan teks prompt hasil optimasi, tanpa pendahuluan atau penutup.
2. Gunakan bahasa Inggris karena model AI lebih memahami deskripsi bahasa Inggris.
3. Tambahkan detail tentang pencahayaan (lighting), gaya kamera (camera angle, lens), kualitas (misal: 8k, photorealistic, cinematic), dan suasana (mood).
Contoh input: "kucing pakai kacamata"
Output: "A highly detailed, photorealistic close-up of a cute fluffy cat wearing stylish round sunglasses, sitting in a cozy sunlit cafe. Cinematic lighting, soft bokeh background, 8k resolution, shot on 85mm lens, highly textured, vibrant colors, masterpiece."`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gagal mengoptimasi prompt");
    }

    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim() || prompt;
    return NextResponse.json({ optimizedPrompt });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
