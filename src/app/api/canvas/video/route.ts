import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const ruxaApiKey = process.env.RUXA_API_KEY;
    if (!ruxaApiKey) {
      return NextResponse.json({ error: "RUXA API KEY tidak dikonfigurasi" }, { status: 500 });
    }

    const res = await fetch("https://api.ruxa.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ruxaApiKey}`,
      },
      body: JSON.stringify({
        model: "veo-3-1",
        prompt: "Animate this image smoothly",
        image_url: imageUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.data || !data.data[0]?.url) {
      throw new Error(data.error?.message || "Gagal membuat video di Ruxa API");
    }

    return NextResponse.json({ url: data.data[0].url });
  } catch (error: any) {
    console.error("Canvas Video API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to animate video" }, { status: 500 });
  }
}
