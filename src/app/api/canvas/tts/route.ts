import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/services/ai";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioBuffer = await ai.tts.generateSpeech(text, voice);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="speech.mp3"',
      },
    });
  } catch (error: any) {
    console.error("Canvas TTS API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 });
  }
}
