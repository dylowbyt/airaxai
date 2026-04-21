import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

const SAKURUPIAH_API_URL =
  process.env.SAKURUPIAH_MODE === "production"
    ? "https://sakurupiah.id/api/create.php"
    : "https://sakurupiah.id/api-sanbox/create.php";

export async function POST(req: NextRequest) {
  try {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, paymentMethod } = await req.json();

    if (!planId || !paymentMethod) {
      return NextResponse.json(
        { error: "planId dan paymentMethod diperlukan" },
        { status: 400 }
      );
    }

    // Fetch subscription plans from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "subscription_plans")
      .single();

    if (!settings?.value) {
      return NextResponse.json(
        { error: "Paket langganan tidak ditemukan" },
        { status: 500 }
      );
    }

    const plans = settings.value as Array<{
      id: string;
      name: string;
      price: number;
    }>;
    const selectedPlan = plans.find((p) => p.id === planId);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Paket tidak valid" },
        { status: 400 }
      );
    }

    if (selectedPlan.price === 0) {
      return NextResponse.json(
        { error: "Paket gratis tidak memerlukan pembayaran" },
        { status: 400 }
      );
    }

    const apiId = process.env.SAKURUPIAH_API_ID!;
    const apiKey = process.env.SAKURUPIAH_API_KEY!;

    if (!apiId || !apiKey) {
      return NextResponse.json(
        { error: "Sakurupiah API belum dikonfigurasi" },
        { status: 500 }
      );
    }

    const merchantRef = `SUB-${user.id.substring(0, 8)}-${Date.now()}`;
    const amount = String(selectedPlan.price);

    const signatureData = `${apiId}${paymentMethod}${merchantRef}${amount}`;
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(signatureData)
      .digest("hex");

    const formData = new URLSearchParams();
    formData.append("api_id", apiId);
    formData.append("method", paymentMethod);
    formData.append("name", user.user_metadata?.full_name || user.email || "User");
    formData.append("email", user.email || "");
    formData.append("phone", "081234567890");
    formData.append("amount", amount);
    formData.append("merchant_fee", "1");
    formData.append("merchant_ref", merchantRef);
    formData.append("expired", "24");
    formData.append("produk[]", `Langganan ${selectedPlan.name}`);
    formData.append("qty[]", "1");
    formData.append("harga[]", amount);
    formData.append("size[]", "-");
    formData.append("note[]", `Langganan AIRAX AI - 30 Hari`);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const isLocal = baseUrl.includes("localhost");
    const safeCallbackUrl = isLocal 
      ? "https://airax-ai.vercel.app/api/webhooks/sakurupiah" 
      : `${baseUrl}/api/webhooks/sakurupiah`;
    
    formData.append("callback_url", safeCallbackUrl);
    formData.append(
      "return_url",
      `${isLocal ? "https://airax-ai.vercel.app" : baseUrl}/subscription?status=success`
    );
    formData.append("signature", signature);

    const sakurupiahRes = await fetch(SAKURUPIAH_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const sakurupiahData = await sakurupiahRes.json();

    if (sakurupiahData.status !== "200") {
      return NextResponse.json(
        { error: sakurupiahData.message || "Gagal membuat invoice" },
        { status: 400 }
      );
    }

    const invoiceData = sakurupiahData.data?.[0];

    // Save transaction
    await supabase.from("transactions").insert([
      {
        user_id: user.id,
        transaction_id: invoiceData?.trx_id || null,
        merchant_ref: merchantRef,
        amount: selectedPlan.price,
        status: "pending",
        payment_gateway: "sakurupiah",
        payment_method: paymentMethod,
        package_name: selectedPlan.name,
        checkout_url: invoiceData?.checkout_url || null,
        transaction_type: "subscription",
        subscription_tier: selectedPlan.id
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        checkout_url: invoiceData?.checkout_url,
      },
    });
  } catch (error: any) {
    console.error("Subscription Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
