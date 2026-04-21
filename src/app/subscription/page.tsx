"use client";

import { useState, useEffect } from "react";
import { Crown, Check, Zap, Star, Sparkles, Loader2, X, CreditCard, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features?: string[];
  badge?: string;
  isPopular?: boolean;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Untuk eksplorasi awal",
    features: [
      "100 kredit AI/bulan",
      "Generate 10 gambar",
      "3 Shorts video",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149000,
    description: "Untuk kreator serius",
    badge: "Populer",
    isPopular: true,
    features: [
      "5.000 kredit AI/bulan",
      "Generate gambar unlimited",
      "50 Shorts video/bulan",
      "Runway animation HD",
    ],
  },
];

const PAYMENT_METHODS = [
  { id: "QRIS", name: "QRIS / Semua E-Wallet", icon: <QrCode className="w-5 h-5" /> },
  { id: "OVO", name: "OVO", icon: <CreditCard className="w-5 h-5" /> },
  { id: "DANA", name: "DANA", icon: <CreditCard className="w-5 h-5" /> },
  { id: "BSIVA", name: "BSI Virtual Account", icon: <CreditCard className="w-5 h-5" /> },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SubscriptionPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "subscription_plans")
        .single();
      
      if (data?.value && data.value.length > 0) {
        setPlans(data.value);
      } else {
        setPlans(DEFAULT_PLANS);
      }
      setLoading(false);
    }
    fetchPlans();

    // Check status from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setSuccess(true);
    }
  }, []);

  async function handlePurchase() {
    if (!selectedPlan || !selectedMethod) return;
    
    setPurchasing(true);
    try {
      const res = await fetch("/api/subscription/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentMethod: selectedMethod,
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.checkout_url) {
        window.location.href = result.data.checkout_url;
      } else {
        alert(result.error || "Gagal membuat invoice pembayaran");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
        <p className="text-text-muted">Memuat paket langganan...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-2xl mb-8">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-black text-text-primary mb-4">Langganan Aktif! 💎</h1>
        <p className="text-text-secondary mb-10 text-lg">
          Terima kasih! Paket langganan Anda telah aktif. Nikmati fitur premium AIRAX AI sekarang.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="px-10 py-4 rounded-2xl bg-accent-primary text-white font-bold hover:bg-accent-secondary transition-all"
        >
          Ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/20">
          <Sparkles className="w-4 h-4 text-accent-primary" />
          <span className="text-xs font-bold text-accent-primary uppercase tracking-widest">Pricing Plans</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight">
          Pilih Paket <span className="gradient-text">Kreativitas</span>
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto text-lg">
          Mulai dari gratis hingga fitur profesional tanpa batas. Upgrade kapanpun kamu siap.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 glass ${
              plan.isPopular 
              ? "border-accent-primary bg-accent-primary/5 shadow-2xl shadow-accent-primary/20" 
              : "border-white/10 hover:border-white/20"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${
                plan.id === "pro" ? "from-accent-primary to-accent-secondary" : "from-white/20 to-white/5"
              }`}>
                {plan.id === "enterprise" ? <Crown className="w-7 h-7" /> : <Star className="w-7 h-7" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="text-sm text-text-muted line-clamp-1">{plan.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-text-primary">{formatCurrency(plan.price)}</span>
                <span className="text-text-muted text-sm font-medium">/bulan</span>
              </div>
            </div>

            <div className="space-y-4 flex-1 mb-8">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Apa yang kamu dapatkan:</p>
              <ul className="space-y-3">
                {(plan.features || ["Akses fitur dasar", "Komunitas support"]).map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                    <div className="mt-1 p-0.5 rounded-full bg-emerald-500/20">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              id={`buy-plan-${plan.id}`}
              onClick={() => {
                if (plan.price === 0) return;
                setSelectedPlan(plan);
              }}
              disabled={plan.price === 0}
              className={`w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                plan.price === 0 ? "bg-white/5 text-text-muted cursor-not-allowed" :
                plan.isPopular 
                ? "bg-accent-primary text-white hover:bg-accent-secondary shadow-lg shadow-accent-primary/25" 
                : "bg-white/5 text-text-primary hover:bg-white/10 border border-white/10"
              }`}
            >
              {plan.price === 0 ? "Paket Saat Ini" : `Beli Paket ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPlan(null)} />
          <div className="relative glass-strong w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/10 text-text-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Metode Pembayaran</h3>
              <p className="text-sm text-text-muted mt-1">Selesaikan pembayaran untuk {selectedPlan.name}</p>
            </div>

            <div className="space-y-3 mb-8">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  id={`method-${method.id}`}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    selectedMethod === method.id
                      ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                      : "bg-white/5 border-white/5 text-text-secondary hover:border-white/20"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedMethod === method.id ? "bg-accent-primary text-white" : "bg-white/5"}`}>
                    {method.icon}
                  </div>
                  <span className="font-bold text-sm">{method.name}</span>
                  {selectedMethod === method.id && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-sm text-text-muted">Total Bayar:</span>
                <span className="text-lg font-black text-text-primary">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <button
                onClick={handlePurchase}
                disabled={!selectedMethod || purchasing}
                className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:bg-accent-secondary shadow-lg shadow-accent-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>Lanjutkan Pembayaran</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass p-8 rounded-[2rem] border border-white/10 text-center max-w-2xl mx-auto">
        <p className="text-text-secondary mb-4">Butuh paket kustom untuk tim besar?</p>
        <button className="text-accent-primary font-bold hover:underline cursor-pointer">Hubungi Tim Penjualan AIRAX AI</button>
      </div>
    </div>
  );
}
