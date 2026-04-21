"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Loader2,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Wallet,
  Building2,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular: boolean;
}

const PAYMENT_METHODS = [
  { code: "QRIS", name: "QRIS", icon: <QrCode className="w-5 h-5" />, type: "QRIS" },
  { code: "DANA", name: "DANA", icon: <Wallet className="w-5 h-5" />, type: "E-Wallet" },
  { code: "ShopeePay", name: "ShopeePay", icon: <Wallet className="w-5 h-5" />, type: "E-Wallet" },
  { code: "BCAVA", name: "BCA VA", icon: <Building2 className="w-5 h-5" />, type: "Virtual Account" },
  { code: "BRIVA", name: "BRI VA", icon: <Building2 className="w-5 h-5" />, type: "Virtual Account" },
  { code: "BNIVA", name: "BNI VA", icon: <Building2 className="w-5 h-5" />, type: "Virtual Account" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TopUpClient() {
  const supabase = createClient();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<number>(0);
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      // Fetch token packages from app_settings
      const { data: settings } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "token_packages")
        .single();

      if (settings?.value) {
        setPackages(settings.value as TokenPackage[]);
      }

      // Fetch current token balance
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tokens")
          .eq("id", user.id)
          .single();
        if (profile) setCurrentTokens(profile.tokens);

        // Fetch recent transactions
        const { data: txns } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (txns) setTransactions(txns);
      }
    }
    init();
  }, []);

  // Check URL params for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setStep("success");
    }
  }, []);

  async function handleCreateInvoice() {
    if (!selectedPackage || !selectedMethod) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/topup/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat invoice");
      }

      setInvoiceData(data.data);
      setStep("payment");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  const packageIcons: Record<string, React.ReactNode> = {
    starter: <Zap className="w-6 h-6" />,
    creator: <Star className="w-6 h-6" />,
    pro: <TrendingUp className="w-6 h-6" />,
    business: <Shield className="w-6 h-6" />,
  };

  const packageGradients: Record<string, string> = {
    starter: "from-blue-500/20 to-cyan-500/10",
    creator: "from-accent-primary/20 to-accent-secondary/10",
    pro: "from-amber-500/20 to-orange-500/10",
    business: "from-emerald-500/20 to-teal-500/10",
  };

  const packageBorders: Record<string, string> = {
    starter: "border-blue-500/30",
    creator: "border-accent-primary/40",
    pro: "border-amber-500/30",
    business: "border-emerald-500/30",
  };

  const packageIconBg: Record<string, string> = {
    starter: "from-blue-500 to-cyan-500",
    creator: "from-accent-primary to-accent-secondary",
    pro: "from-amber-500 to-orange-500",
    business: "from-emerald-500 to-teal-500",
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
            Top Up Token
          </span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Isi Ulang{" "}
          <span className="gradient-text">Token AIRAX</span>
        </h1>
        <p className="text-text-secondary">
          Saldo saat ini:{" "}
          <span className="font-bold text-amber-400">
            {currentTokens.toLocaleString("id-ID")} Token
          </span>
        </p>
      </div>

      {/* Step: Select Package */}
      {step === "select" && (
        <>
          {/* Token Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                id={`topup-pkg-${pkg.id}`}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative flex flex-col p-5 rounded-2xl border bg-gradient-to-b transition-all duration-300 cursor-pointer text-left
                  hover:scale-[1.02] hover:shadow-lg
                  ${packageGradients[pkg.id] || "from-white/10 to-white/5"}
                  ${
                    selectedPackage === pkg.id
                      ? `${packageBorders[pkg.id] || "border-accent-primary/40"} ring-2 ring-accent-primary/30 shadow-xl`
                      : "border-white/10 hover:border-white/20"
                  }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-[10px] font-bold shadow-lg">
                      POPULER
                    </span>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${packageIconBg[pkg.id] || "from-accent-primary to-accent-secondary"} flex items-center justify-center text-white mb-3`}>
                  {packageIcons[pkg.id] || <Coins className="w-6 h-6" />}
                </div>

                <h3 className="font-bold text-text-primary text-sm">{pkg.name}</h3>
                <div className="mt-1 mb-3">
                  <span className="text-2xl font-bold text-text-primary">
                    {pkg.tokens.toLocaleString("id-ID")}
                  </span>
                  <span className="text-text-muted text-xs ml-1">Token</span>
                </div>
                <div className="mt-auto">
                  <span className="text-lg font-bold text-text-primary">
                    {formatCurrency(pkg.price)}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mt-1">
                  {formatCurrency(Math.round(pkg.price / pkg.tokens))}/token
                </p>
              </button>
            ))}
          </div>

          {/* Payment Methods */}
          {selectedPackage && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                Pilih Metode Pembayaran
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.code}
                    id={`topup-method-${method.code}`}
                    onClick={() => setSelectedMethod(method.code)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                      ${
                        selectedMethod === method.code
                          ? "bg-accent-primary/15 border-accent-primary/40 text-accent-primary"
                          : "bg-white/5 border-white/10 text-text-secondary hover:border-white/20 hover:bg-white/8"
                      }`}
                  >
                    {method.icon}
                    <span className="text-xs font-medium">{method.name}</span>
                    <span className="text-[10px] text-text-muted">{method.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary + CTA */}
          {selectedPackage && selectedMethod && (
            <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Ringkasan Pembelian</p>
                  <p className="font-bold text-text-primary">
                    {selectedPkg?.name} — {selectedPkg?.tokens.toLocaleString("id-ID")} Token
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">Total Bayar</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {formatCurrency(selectedPkg?.price || 0)}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              <button
                id="topup-pay-btn"
                onClick={handleCreateInvoice}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bayar Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Riwayat Transaksi Terbaru
              </h3>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="glass p-4 rounded-xl border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          tx.status === "success"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : tx.status === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {tx.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : tx.status === "pending" ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Coins className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {tx.package_name || "Top Up Token"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(tx.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text-primary">
                        +{tx.tokens_awarded?.toLocaleString("id-ID")} Token
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          tx.status === "success"
                            ? "text-emerald-400"
                            : tx.status === "pending"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {tx.status === "success"
                          ? "Berhasil"
                          : tx.status === "pending"
                          ? "Menunggu"
                          : tx.status === "expired"
                          ? "Kedaluwarsa"
                          : "Gagal"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Step: Payment Created */}
      {step === "payment" && invoiceData && (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="glass p-8 rounded-2xl border border-white/10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Invoice Dibuat!
              </h2>
              <p className="text-text-secondary text-sm">
                Silakan selesaikan pembayaran melalui halaman checkout
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Paket</span>
                <span className="text-text-primary font-medium">
                  {invoiceData.package_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Token</span>
                <span className="text-amber-400 font-bold">
                  +{invoiceData.tokens?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Bayar</span>
                <span className="text-text-primary font-bold">
                  {formatCurrency(invoiceData.amount)}
                </span>
              </div>
              {invoiceData.payment_no && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Nomor Pembayaran</span>
                  <span className="text-text-primary font-mono text-xs">
                    {invoiceData.payment_no}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Kedaluwarsa</span>
                <span className="text-rose-400 text-xs">
                  {invoiceData.expired}
                </span>
              </div>
            </div>

            {invoiceData.checkout_url && (
              <a
                href={invoiceData.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
              >
                <ExternalLink className="w-5 h-5" />
                Buka Halaman Pembayaran
              </a>
            )}

            <button
              onClick={() => {
                setStep("select");
                setInvoiceData(null);
                setSelectedPackage(null);
                setSelectedMethod(null);
              }}
              className="w-full btn-secondary py-3 text-sm cursor-pointer"
            >
              Kembali ke Paket
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="max-w-lg mx-auto py-10 animate-in fade-in zoom-in duration-500">
          <div className="glass p-10 rounded-[2.5rem] border border-emerald-500/20 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] -z-10" />
            
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 transform hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-4 mb-10">
              <h2 className="text-3xl font-black text-text-primary tracking-tight">
                Pembelian Berhasil! 🎉
              </h2>
              <p className="text-text-secondary text-base max-w-[280px] mx-auto">
                Token kamu sudah ditambahkan ke saldo akun secara otomatis.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => (window.location.href = "/chat")}
                className="w-full py-4 rounded-2xl bg-accent-primary text-white font-bold hover:bg-accent-secondary shadow-lg shadow-accent-primary/25 transition-all cursor-pointer"
              >
                Mulai Gunakan Token
              </button>
              <button
                onClick={() => {
                  setStep("select");
                  window.history.replaceState({}, "", "/topup");
                }}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-text-secondary font-bold hover:bg-white/10 transition-all cursor-pointer"
              >
                Kembali ke Topup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="glass p-5 rounded-2xl border border-white/10 flex items-start gap-3">
        <Shield className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Pembayaran Aman via Sakurupiah
          </p>
          <p className="text-xs text-text-muted mt-1">
            Semua pembayaran diproses melalui payment gateway Sakurupiah yang resmi terdaftar.
            Token akan otomatis masuk ke saldo kamu setelah pembayaran dikonfirmasi.
          </p>
        </div>
      </div>
    </div>
  );
}
