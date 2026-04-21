import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

const SAKURUPIAH_API_URL =
  process.env.SAKURUPIAH_MODE === "production"
    ? "https://sakurupiah.id/api/create.php"
    : "https://sakurupiah.id/api-sanbox/create.php"; // Memang sengaja salah ketik "sanbox" dari Sakurupiah

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

    const { packageId, paymentMethod } = await req.json();

    if (!packageId || !paymentMethod) {
      return NextResponse.json(
        { error: "packageId dan paymentMethod diperlukan" },
        { status: 400 }
      );
    }

    // Fetch token packages from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "token_packages")
      .single();

    if (!settings?.value) {
      return NextResponse.json(
        { error: "Paket token tidak ditemukan" },
        { status: 500 }
      );
    }

    const packages = settings.value as Array<{
      id: string;
      name: string;
      tokens: number;
      price: number;
    }>;
    const selectedPackage = packages.find((p) => p.id === packageId);

    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Paket tidak valid" },
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

    // Generate unique merchant reference
    const merchantRef = `AIRAX-${user.id.substring(0, 8)}-${Date.now()}`;
    const amount = String(selectedPackage.price);

    // Create HMAC-SHA256 signature per Sakurupiah docs
    // signature = HMAC-SHA256(api_id + method + merchant_ref + amount, apikey)
    const signatureData = `${apiId}${paymentMethod}${merchantRef}${amount}`;
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(signatureData)
      .digest("hex");

    // Build form data for Sakurupiah API
    const formData = new URLSearchParams();
    formData.append("api_id", apiId);
    formData.append("method", paymentMethod);
    formData.append("name", user.user_metadata?.full_name || user.email || "User");
    formData.append("email", user.email || "");
    formData.append("phone", user.phone || "081234567890"); // Sakurupiah membutuhkan string nomor HP yang valid
    formData.append("amount", amount);
    formData.append("merchant_fee", "1"); // Merchant pays the fee
    formData.append("merchant_ref", merchantRef);
    formData.append("expired", "24"); // 24 hours expiry
    formData.append("produk[]", selectedPackage.name);
    formData.append("qty[]", "1");
    formData.append("harga[]", amount);
    formData.append("size[]", "-");
    formData.append("note[]", `${selectedPackage.tokens} Token AIRAX AI`);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    // Sakurupiah menolak "http://localhost", jadi kita akali dengan https dummy saat development lokal
    const isLocal = baseUrl.includes("localhost");
    const safeCallbackUrl = isLocal 
      ? "https://airax-ai.vercel.app/api/webhooks/sakurupiah" 
      : `${baseUrl}/api/webhooks/sakurupiah`;
    
    formData.append("callback_url", safeCallbackUrl);
    formData.append(
      "return_url",
      `${isLocal ? "https://airax-ai.vercel.app" : baseUrl}/topup?status=success`
    );
    formData.append("signature", signature);

    // Call Sakurupiah API
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
      console.error("Sakurupiah API error:", sakurupiahData);
      return NextResponse.json(
        { error: sakurupiahData.message || "Gagal membuat invoice" },
        { status: 400 }
      );
    }

    const invoiceData = sakurupiahData.data?.[0];

    // Save transaction to Supabase
    await supabase.from("transactions").insert([
      {
        user_id: user.id,
        transaction_id: invoiceData?.trx_id || null,
        merchant_ref: merchantRef,
        amount: selectedPackage.price,
        tokens_awarded: selectedPackage.tokens,
        status: "pending",
        payment_gateway: "sakurupiah",
        payment_method: paymentMethod,
        package_name: selectedPackage.name,
        checkout_url: invoiceData?.checkout_url || null,
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trx_id: invoiceData?.trx_id,
        merchant_ref: merchantRef,
        payment_no: invoiceData?.payment_no,
        checkout_url: invoiceData?.checkout_url,
        qr: invoiceData?.qr,
        expired: invoiceData?.expired,
        amount: selectedPackage.price,
        tokens: selectedPackage.tokens,
        package_name: selectedPackage.name,
      },
    });
  } catch (error: unknown) {
    console.error("Payment create-invoice error:", error);
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
