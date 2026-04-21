import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkAndDeductUsage } from "@/lib/tokenomics";

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

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Tokenomics: Check daily image limit & deduct tokens ──
    const usageCheck = await checkAndDeductUsage(user.id, "image");
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, type: "limit_exceeded" },
        { status: 429 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `${prompt}, ultra realistic, 9:16 vertical aspect ratio, cinematic quality, professional photography`,
        n: 1,
        size: "1024x1792",
        quality: "hd",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gagal generate gambar dari OpenAI");
    }

    const imageUrl = data.data[0]?.url;
    if (!imageUrl) throw new Error("Tidak ada URL gambar dari respons API");

    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
