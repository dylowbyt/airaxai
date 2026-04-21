import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Admin client bypasses RLS for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const callbackSignature = req.headers.get("x-callback-signature") || "";
    const callbackEvent = req.headers.get("x-callback-event") || "";

    // Validate signature using HMAC-SHA256
    const apiKey = process.env.SAKURUPIAH_API_KEY!;
    if (apiKey) {
      const expectedSignature = crypto
        .createHmac("sha256", apiKey)
        .update(rawBody)
        .digest("hex");

      if (callbackSignature && callbackSignature !== expectedSignature) {
        console.error("Invalid callback signature");
        return NextResponse.json(
          { success: false, message: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    // Validate callback event
    if (callbackEvent && callbackEvent !== "payment_status") {
      return NextResponse.json(
        { success: false, message: `Unrecognized callback event: ${callbackEvent}` },
        { status: 400 }
      );
    }

    // Parse the callback data
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const {
      trx_id,
      merchant_ref,
      status: paymentStatus,
      status_kode,
    } = data;

    if (!trx_id && !merchant_ref) {
      return NextResponse.json(
        { success: false, message: "Missing trx_id or merchant_ref" },
        { status: 400 }
      );
    }

    // Find the transaction by merchant_ref or trx_id
    let query = supabaseAdmin
      .from("transactions")
      .select("*");

    if (merchant_ref) {
      query = query.eq("merchant_ref", merchant_ref);
    } else {
      query = query.eq("transaction_id", trx_id);
    }

    const { data: transaction } = await query.single();

    if (!transaction) {
      console.error("Transaction not found:", { trx_id, merchant_ref });
      return NextResponse.json(
        { success: false, message: "Transaction not found" },
        { status: 404 }
      );
    }

    // Handle payment status
    if (paymentStatus === "berhasil" && status_kode === 1) {
      // Payment successful — only process if not already processed
      if (transaction.status !== "success") {
        // Update transaction status
        await supabaseAdmin
          .from("transactions")
          .update({
            status: "success",
            transaction_id: trx_id || transaction.transaction_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id);

        // Add tokens to user's balance
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("tokens")
          .eq("id", transaction.user_id)
          .single();

        const currentTokens = profile?.tokens || 0;
        const newBalance = currentTokens + (transaction.tokens_awarded || 0);

        await supabaseAdmin
          .from("profiles")
          .update({ tokens: newBalance })
          .eq("id", transaction.user_id);

        // Handle Subscription Logic
        if (transaction.transaction_type === "subscription") {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 days access

          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: transaction.subscription_tier || "pro",
              subscription_expires_at: expiryDate.toISOString()
            })
            .eq("id", transaction.user_id);
        }

        // Add purchase notification
        await supabaseAdmin
          .from("notifications")
          .insert([{
            user_id: transaction.user_id,
            title: transaction.transaction_type === "subscription" ? "Langganan Berhasil! 💎" : "Pembelian Berhasil! 🎉",
            message: transaction.transaction_type === "subscription" 
              ? `Selamat! Anda kini berlangganan paket ${transaction.package_name}. Akses Pro aktif hingga 30 hari ke depan.`
              : `Paket ${transaction.tokens_awarded} Token telah ditambahkan ke akun Anda. Selamat berkarya!`,
            status: "promo",
            is_active: true
          }]);

        console.log(
          `✅ Payment success: ${trx_id} | User: ${transaction.user_id} | +${transaction.tokens_awarded} tokens | New balance: ${newBalance}`
        );
      }

      return NextResponse.json({
        success: true,
        message: "Payment status berhasil",
      });
    } else if (paymentStatus === "expired" && status_kode === 2) {
      // Payment expired
      await supabaseAdmin
        .from("transactions")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      return NextResponse.json({
        success: true,
        message: "Payment status expired",
      });
    } else if (paymentStatus === "pending" && status_kode === 0) {
      // Still pending — no action needed
      return NextResponse.json({
        success: true,
        message: "Payment status pending",
      });
    } else {
      console.warn("Unknown payment status:", { paymentStatus, status_kode });
      return NextResponse.json({
        success: false,
        message: "Unknown payment status",
      });
    }
  } catch (error: unknown) {
    console.error("Sakurupiah Webhook Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
