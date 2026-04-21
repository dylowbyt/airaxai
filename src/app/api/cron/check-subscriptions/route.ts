import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Protect route with secret (set this in Vercel/Env)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(now.getDate() + 1);

    // 1. Remind users (expires in 24-48 hours)
    const { data: expiringSoon } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .gt("subscription_expires_at", now.toISOString())
      .lt("subscription_expires_at", oneDayFromNow.toISOString())
      .neq("subscription_tier", "free");

    if (expiringSoon && expiringSoon.length > 0) {
      const notifications = expiringSoon.map(user => ({
        user_id: user.id,
        title: "Peringatan: Langganan Berakhir Besok! ⏳",
        message: `Halo ${user.full_name || 'User'}, paket langganan Anda akan berakhir dalam 24 jam. Segera perpanjang untuk tetap menikmati fitur Pro!`,
        status: "maintenance",
        is_active: true
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    // 2. Handle expired subscriptions
    const { data: expired } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .lt("subscription_expires_at", now.toISOString())
      .neq("subscription_tier", "free");

    if (expired && expired.length > 0) {
      // Downgrade users
      const expiredIds = expired.map(u => u.id);
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_tier: "free" })
        .in("id", expiredIds);

      // Notify users
      const notifications = expired.map(user => ({
        user_id: user.id,
        title: "Langganan Berakhir 🛑",
        message: `Paket langganan Anda telah berakhir dan akun dikembalikan ke paket Free. Data Anda tetap aman.`,
        status: "general",
        is_active: true
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      success: true,
      reminded: expiringSoon?.length || 0,
      expired: expired?.length || 0
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
