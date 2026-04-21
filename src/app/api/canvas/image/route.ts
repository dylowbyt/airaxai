import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const ruxaApiKey = process.env.RUXA_API_KEY;
    if (!ruxaApiKey) {
      return NextResponse.json({ error: "RUXA API KEY tidak dikonfigurasi" }, { status: 500 });
    }

    const res = await fetch("https://api.ruxa.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ruxaApiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-pro",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.data || !data.data[0]?.url) {
      throw new Error(data.error?.message || "Gagal membuat gambar di Ruxa API");
    }

    return NextResponse.json({ url: data.data[0].url });
  } catch (error: any) {
    console.error("Canvas Image API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate image" }, { status: 500 });
  }
}
