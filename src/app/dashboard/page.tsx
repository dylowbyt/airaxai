import { createClient } from "@/lib/supabase/server";
import {
  Zap,
  TrendingUp,
  Film,
  Clock,
  Image,
  ArrowUpRight,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — AIRAX AI",
};

async function getStats(userId: string) {
  const supabase = await createClient();
  const [reels, shorts, history] = await Promise.all([
    supabase
      .from("reels")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("shorts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return {
    reels: reels.count ?? 0,
    shorts: shorts.count ?? 0,
    history: history.count ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Creator";

  let stats = { reels: 0, shorts: 0, history: 0 };
  try {
    stats = await getStats(user!.id);
  } catch {
    // Tables may not exist yet — graceful fallback
  }

  const statCards = [
    {
      icon: <Film className="w-6 h-6" />,
      label: "Reels Dibuat",
      value: stats.reels,
      color: "from-accent-primary to-accent-secondary",
      href: "/reels",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      label: "Shorts Dibuat",
      value: stats.shorts,
      color: "from-accent-cyan to-accent-primary",
      href: "/shorts",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Total Aktivitas",
      value: stats.history,
      color: "from-accent-secondary to-accent-rose",
      href: "/history",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Kredit AI",
      value: "1,000",
      color: "from-accent-emerald to-accent-cyan",
      href: "/subscription",
    },
  ];

  const quickActions = [
    {
      href: "/shorts",
      icon: <Zap className="w-8 h-8" />,
      title: "Buat Shorts",
      desc: "Produksi video vertikal 9:16 dengan AI",
      gradient: "from-accent-primary to-accent-secondary",
    },
    {
      href: "/reels",
      icon: <Film className="w-8 h-8" />,
      title: "Reels Gallery",
      desc: "Jelajahi & remix kreasi komunitas",
      gradient: "from-accent-cyan to-accent-primary",
    },
    {
      href: "/history",
      icon: <Clock className="w-8 h-8" />,
      title: "Riwayat",
      desc: "Lihat semua kreasi yang pernah dibuat",
      gradient: "from-accent-secondary to-accent-rose",
    },
    {
      href: "/subscription",
      icon: <Star className="w-8 h-8" />,
      title: "Upgrade Plan",
      desc: "Unlock fitur premium & kredit tak terbatas",
      gradient: "from-accent-emerald to-accent-cyan",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 50%, rgba(6,182,212,0.1) 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(99,102,241,0.15), transparent)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent-primary" />
            <span className="text-xs font-semibold text-accent-primary uppercase tracking-widest">
              Selamat Datang
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
            Halo, {displayName} 👋
          </h2>
          <p className="text-text-secondary text-sm max-w-lg">
            Platform AI kreatif kamu siap digunakan. Buat konten luar biasa
            dengan teknologi generasi terbaru.
          </p>
          <Link
            href="/shorts"
            id="dashboard-create-cta"
            className="mt-4 inline-flex items-center gap-2 btn-primary text-sm"
          >
            <Zap className="w-4 h-4" />
            Mulai Buat Konten
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            id={`stat-card-${card.label.replace(/\s/g, "-").toLowerCase()}`}
            className="stat-card p-5 rounded-2xl flex flex-col gap-3 group hover:scale-[1.02] transition-transform duration-200"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white opacity-90 group-hover:opacity-100 shadow-lg`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              id={`quick-action-${action.href.replace("/", "")}`}
              className="group glow-border p-5 rounded-2xl flex flex-col gap-4 bg-bg-card border border-white/8
                hover:border-accent-primary/30 hover:bg-bg-card-hover transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white
                  shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
              >
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm mb-1">
                  {action.title}
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  {action.desc}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors self-end mt-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
