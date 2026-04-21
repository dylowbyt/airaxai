import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkAndDeductUsage } from "@/lib/tokenomics";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl diperlukan" }, { status: 400 });
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

    // ── Tokenomics: Check daily video limit & deduct tokens ──
    const usageCheck = await checkAndDeductUsage(user.id, "video");
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason, type: "limit_exceeded" },
        { status: 429 }
      );
    }

    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) {
      // Graceful fallback: return a demo video URL when API key not set
      return NextResponse.json({
        videoUrl: null,
        message: "Runway API key belum dikonfigurasi. Set RUNWAY_API_KEY di .env.local",
      });
    }

    // Runway Gen-3 Alpha image-to-video
    const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptImage: imageUrl,
        promptText: prompt,
        ratio: "768:1344",
        duration: 5,
      }),
    });

    const taskData = await response.json();

    if (!response.ok) {
      throw new Error(taskData.error || "Gagal memulai task video Runway");
    }

    // Poll for completion
    const taskId = taskData.id;
    let videoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const statusRes = await fetch(
        `https://api.dev.runwayml.com/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Runway-Version": "2024-11-06",
          },
        }
      );

      const statusData = await statusRes.json();

      if (statusData.status === "SUCCEEDED") {
        videoUrl = statusData.output?.[0] ?? null;
        break;
      } else if (statusData.status === "FAILED") {
        throw new Error("Runway task gagal: " + (statusData.failure || "unknown"));
      }

      attempts++;
    }

    if (!videoUrl) {
      throw new Error("Timeout: Video belum selesai diproses");
    }

    return NextResponse.json({ videoUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
