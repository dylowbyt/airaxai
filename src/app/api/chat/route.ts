import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkAndDeductUsage } from "@/lib/tokenomics";

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId, isVision, mode = "chat", model = "gpt-4o", prompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages diperlukan" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const ruxaApiKey = process.env.RUXA_API_KEY;

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

    // Save user message
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession } = await supabase.from("chat_sessions").insert([{ user_id: user.id }]).select().single();
      activeSessionId = newSession?.id;
    }

    const lastMessage = messages[messages.length - 1];
    let textContent = "";
    let uploadedImageUrl = null;
    
    if (typeof lastMessage.content === "string") {
      textContent = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textPart = lastMessage.content.find((p: any) => p.type === "text");
      const imgPart = lastMessage.content.find((p: any) => p.type === "image_url");
      if (textPart) textContent = textPart.text;
      if (imgPart) uploadedImageUrl = imgPart.image_url.url;
    }

    if (activeSessionId) {
      await supabase.from("chat_messages").insert([{
        session_id: activeSessionId,
        user_id: user.id,
        role: "user",
        content: textContent,
        image_url: uploadedImageUrl
      }]);
    }

    // Fetch dynamic costs from app_settings
    const { data: costsSetting } = await supabase.from("app_settings").select("value").eq("key", "generation_costs").single();
    const dynamicCosts = costsSetting?.value || {};

    let finalContent = "";
    let mediaResult = null;

    if (mode === "image") {
      if (!ruxaApiKey) return NextResponse.json({ error: "Ruxa API key tidak dikonfigurasi" }, { status: 500 });

      let cost = dynamicCosts.image_nano || 5;
      if (model === "nano-banana-2") cost = dynamicCosts.image_nano_2 || 10;
      if (model === "nano-banana-pro") cost = dynamicCosts.image_nano_pro || 20;

      const usageCheck = await checkAndDeductUsage(user.id, "image", cost);
      if (!usageCheck.allowed) return NextResponse.json({ error: usageCheck.reason, type: "limit_exceeded" }, { status: 429 });

      const imgRes = await fetch("https://api.ruxa.ai/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ruxaApiKey}` },
        body: JSON.stringify({ model: model, prompt: prompt || textContent, n: 1, size: "1024x1024" }),
      });
      const imgData = await imgRes.json();
      if (imgData.data?.[0]?.url) {
        mediaResult = { type: "image", url: imgData.data[0].url, prompt: prompt || textContent };
        finalContent = `Gambar berhasil dibuat menggunakan model ${model}.`;
      } else {
        throw new Error("Gagal membuat gambar dari Ruxa API");
      }

    } else if (mode === "video") {
      if (!ruxaApiKey) return NextResponse.json({ error: "Ruxa API key tidak dikonfigurasi" }, { status: 500 });

      let cost = dynamicCosts.video_sora || 20;
      if (model === "veo-3") cost = dynamicCosts.video_veo || 30;
      if (model === "veo-3-1") cost = dynamicCosts.video_veo_pro || 50;

      const usageCheck = await checkAndDeductUsage(user.id, "video", cost);
      if (!usageCheck.allowed) return NextResponse.json({ error: usageCheck.reason, type: "limit_exceeded" }, { status: 429 });

      const vidRes = await fetch("https://api.ruxa.ai/v1/videos/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ruxaApiKey}` },
        body: JSON.stringify({ model: model, prompt: prompt || textContent }),
      });
      const vidData = await vidRes.json();
      if (vidData.data?.[0]?.url) {
        mediaResult = { type: "video", url: vidData.data[0].url, prompt: prompt || textContent };
        finalContent = `Video berhasil dibuat menggunakan model ${model}.`;
      } else {
        throw new Error("Gagal membuat video dari Ruxa API");
      }

    } else {
      if (!apiKey) return NextResponse.json({ error: "OpenAI API key tidak dikonfigurasi" }, { status: 500 });
      
      const isProModel = model === "GPT-5.4";
      const cost = isProModel ? (dynamicCosts.chat_pro ?? 1) : (dynamicCosts.chat_mini ?? 0);
      const usageCheck = await checkAndDeductUsage(user.id, "chat", cost);
      
      if (!usageCheck.allowed) return NextResponse.json({ error: usageCheck.reason, type: "limit_exceeded" }, { status: 429 });

      const systemPrompt = {
        role: "system",
        content: `Kamu adalah AIRAX Assistant. Bantu user menjawab pertanyaan dan menyusun prompt profesional dengan baik. 
${isProModel ? "User saat ini menggunakan model GPT-5.4. Berikan instruksi yang sangat mendalam tentang pencahayaan, komposisi, dan detail hiper-realistik. Jika user bertanya tentang video, berikan panduan frame-by-frame yang sangat teknis." : ""}
Jangan pernah memanggil tools atau generate image. Kamu hanya AI berbasis teks.`,
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: isVision ? "gpt-4o" : (isProModel ? "gpt-4o" : "gpt-4o-mini"),
          messages: [systemPrompt, ...messages],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gagal menghubungi OpenAI");
      finalContent = data.choices[0].message.content;
    }

    if (activeSessionId) {
      await supabase.from("chat_messages").insert([{
        session_id: activeSessionId,
        user_id: user.id,
        role: "assistant",
        content: finalContent || "Memproses permintaan...",
        media_result: mediaResult
      }]);
    }

    return NextResponse.json({ role: "assistant", content: finalContent, mediaResult, sessionId: activeSessionId });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
