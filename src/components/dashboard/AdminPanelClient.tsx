"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Gift,
  Info,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle2,
  Users,
  Zap,
  TrendingUp,
  Settings,
  MessageSquare,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type Notification,
  type NotificationStatus,
  getNotificationColor,
} from "@/lib/supabase/notifications";

function StatusIcon({ status }: { status: NotificationStatus }) {
  if (status === "maintenance") return <AlertTriangle className="w-4 h-4 text-rose-400" />;
  if (status === "promo") return <Gift className="w-4 h-4 text-emerald-400" />;
  return <Info className="w-4 h-4 text-indigo-400" />;
}

export default function AdminPanelClient() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "pricing" | "packages" | "stats">("notifications");
  
  // Dynamic Pricing State
  const [pricing, setPricing] = useState({
    chat_mini: 0,
    chat_pro: 1,
    image_nano: 5,
    image_nano_2: 10,
    image_nano_pro: 20,
    video_sora_2: 2,
    video_veo_3: 3,
    video_veo_3_1: 5,
  });

  // Packages & Subscriptions State
  const [tokenPackages, setTokenPackages] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    message: "",
    status: "general" as NotificationStatus,
    category: "system" as "system" | "social",
  });

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }

  async function fetchSettings() {
    setLoading(true);
    // Fetch pricing
    const { data: pricingData } = await supabase.from("app_settings").select("value").eq("key", "generation_costs").single();
    if (pricingData) setPricing((prev) => ({ ...prev, ...pricingData.value }));

    // Fetch token packages
    const { data: pkgData } = await supabase.from("app_settings").select("value").eq("key", "token_packages").single();
    if (pkgData) setTokenPackages(pkgData.value || []);

    // Fetch subscriptions
    const { data: subData } = await supabase.from("app_settings").select("value").eq("key", "subscription_plans").single();
    if (subData) setSubscriptionPlans(subData.value || []);
    
    setLoading(false);
  }

  async function saveSetting(key: string, value: any) {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key, value });
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  async function handleAdd() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    await supabase.from("notifications").insert([
      {
        title: form.title,
        message: form.message,
        status: form.status,
        category: form.category,
        is_active: true,
      },
    ]);
    setForm({ title: "", message: "", status: "general", category: "system" });
    await fetchNotifications();
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  async function handleToggle(id: string, is_active: boolean) {
    await supabase
      .from("notifications")
      .update({ is_active: !is_active })
      .eq("id", id);
    await fetchNotifications();
  }

  async function handleDelete(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    await fetchNotifications();
  }

  const statCards = [
    { label: "Total User", value: "–", icon: <Users className="w-5 h-5" />, color: "from-accent-primary to-accent-secondary" },
    { label: "Shorts Dibuat", value: "–", icon: <Zap className="w-5 h-5" />, color: "from-accent-cyan to-accent-primary" },
    { label: "Notifikasi Aktif", value: String(notifications.filter(n => n.is_active).length), icon: <Bell className="w-5 h-5" />, color: "from-accent-emerald to-accent-cyan" },
    { label: "Sistem", value: "Online", icon: <TrendingUp className="w-5 h-5" />, color: "from-accent-emerald to-accent-secondary" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          <p className="text-text-secondary text-sm">Kelola sistem AIRAX AI secara penuh</p>
        </div>
        <div className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
          <span className="text-amber-400 text-xs font-bold">ADMIN ACCESS</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card p-4 rounded-2xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white`}>
              {card.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{card.value}</p>
              <p className="text-xs text-text-muted">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0 overflow-x-auto no-scrollbar">
        {(["notifications", "pricing", "packages", "stats"] as const).map((tab) => (
          <button
            key={tab}
            id={`admin-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl -mb-px border-b-2 transition-all duration-200 cursor-pointer capitalize whitespace-nowrap ${
              activeTab === tab
                ? "text-accent-primary border-accent-primary bg-accent-primary/5"
                : "text-text-muted border-transparent hover:text-text-secondary"
            }`}
          >
            {tab === "notifications" ? "Notifikasi" : tab === "pricing" ? "Pricing" : tab === "packages" ? "Topup & Plans" : "Statistik"}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-5">
          {/* Add Notification Form */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent-primary" />
              Buat Notifikasi Baru
            </h3>

            {/* Status selector */}
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Kategori</label>
                <div className="flex gap-2">
                  {(["system", "social"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm(prev => ({ ...prev, category: c }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        form.category === c ? "bg-accent-primary text-white border-accent-primary" : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                      }`}
                    >
                      {c === "system" ? "🛠 System" : "👥 Public"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Status / Icon</label>
                <div className="flex gap-2">
                  {(["maintenance", "promo", "general", "social", "like", "save"] as const).map((s) => {
                    const colors = getNotificationColor(s);
                    return (
                      <button
                        key={s}
                        id={`notif-status-${s}`}
                        onClick={() => setForm((prev) => ({ ...prev, status: s }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          form.status === s
                            ? colors.badge
                            : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        <StatusIcon status={s} />
                        <span className="capitalize">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <input
              id="admin-notif-title"
              type="text"
              placeholder="Judul notifikasi..."
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/50"
            />
            <textarea
              id="admin-notif-message"
              placeholder="Isi pesan notifikasi..."
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-primary/50"
            />

            <div className="flex items-center gap-3">
              <button
                id="admin-notif-add-btn"
                onClick={handleAdd}
                disabled={saving || !form.title.trim() || !form.message.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Menyimpan..." : "Tambah Notifikasi"}
              </button>
              {success && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Berhasil disimpan!
                </span>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
              Notifikasi Aktif ({notifications.filter((n) => n.is_active).length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="glass p-8 rounded-2xl text-center text-text-muted">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const colors = getNotificationColor(notif.status);
                return (
                  <div
                    key={notif.id}
                    id={`admin-notif-${notif.id}`}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      notif.is_active ? "opacity-100" : "opacity-50"
                    }`}
                    style={{ background: colors.bg, borderColor: colors.border }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${colors.text}20` }}>
                        <StatusIcon status={notif.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors.badge}`}>
                            {colors.label}
                          </span>
                          {!notif.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-text-muted border border-white/10">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-text-primary">{notif.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{notif.message}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(notif.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          id={`admin-toggle-${notif.id}`}
                          onClick={() => handleToggle(notif.id, notif.is_active)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          title={notif.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {notif.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-text-muted" />
                          )}
                        </button>
                        <button
                          id={`admin-delete-${notif.id}`}
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer group"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-text-muted group-hover:text-rose-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === "pricing" && (
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Dynamic Pricing & Tokenomics</h3>
              <p className="text-xs text-text-muted">Atur biaya token per model secara real-time</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chat Models */}
            <div className="glass p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-sm font-semibold text-accent-primary flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Chat Models</h4>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>GPT-4o Mini</span> <span className="text-[10px]">Token</span></label>
                <input 
                  type="number" 
                  value={pricing.chat_mini} 
                  onChange={(e) => setPricing({...pricing, chat_mini: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>GPT-5.4 (Latest)</span> <span className="text-[10px]">Token</span></label>
                <input 
                  type="number" 
                  value={pricing.chat_pro} 
                  onChange={(e) => setPricing({...pricing, chat_pro: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50" 
                />
              </div>
            </div>

            {/* Image Models */}
            <div className="glass p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image Models</h4>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Nano Banana</span> <span className="text-[10px]">Token</span></label>
                <input 
                  type="number" 
                  value={pricing.image_nano} 
                  onChange={(e) => setPricing({...pricing, image_nano: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Nano Banana 2</span> <span className="text-[10px]">Token</span></label>
                <input 
                  type="number" 
                  value={pricing.image_nano_2} 
                  onChange={(e) => setPricing({...pricing, image_nano_2: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500/50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Nano Banana Pro</span> <span className="text-[10px]">Token</span></label>
                <input 
                  type="number" 
                  value={pricing.image_nano_pro} 
                  onChange={(e) => setPricing({...pricing, image_nano_pro: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500/50" 
                />
              </div>
            </div>

            {/* Video Models */}
            <div className="glass p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-2"><Video className="w-4 h-4" /> Video Models (Per Detik)</h4>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Sora 2</span> <span className="text-[10px]">Token / Detik</span></label>
                <input 
                   type="number" 
                   value={pricing.video_sora_2} 
                   onChange={(e) => setPricing({...pricing, video_sora_2: parseInt(e.target.value) || 0})}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50" 
                 />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Veo 3</span> <span className="text-[10px]">Token / Detik</span></label>
                <input 
                   type="number" 
                   value={pricing.video_veo_3} 
                   onChange={(e) => setPricing({...pricing, video_veo_3: parseInt(e.target.value) || 0})}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50" 
                 />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-medium flex justify-between"><span>Veo 3.1</span> <span className="text-[10px]">Token / Detik</span></label>
                <input 
                   type="number" 
                   value={pricing.video_veo_3_1} 
                   onChange={(e) => setPricing({...pricing, video_veo_3_1: parseInt(e.target.value) || 0})}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50" 
                 />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              className="btn-primary px-6 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              onClick={() => saveSetting("generation_costs", pricing)}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan Semua Harga"}
            </button>
            {success && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Berhasil!</span>}
          </div>
        </div>
      )}

      {/* Packages & Subscriptions Tab */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          {/* Top-up Packages */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2"><Gift className="w-4 h-4 text-emerald-400" /> Paket Top-up Token</h3>
              <button 
                onClick={() => setTokenPackages([...tokenPackages, { id: Date.now().toString(), name: "Paket Baru", tokens: 100, price: 50000, popular: false }])}
                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-text-secondary"
              >
                + Tambah Paket
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokenPackages.map((pkg, idx) => (
                <div key={pkg.id} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3 relative group">
                  <button 
                    onClick={() => setTokenPackages(tokenPackages.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 text-text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-text-primary p-0"
                    value={pkg.name}
                    onChange={(e) => {
                      const newPkgs = [...tokenPackages];
                      newPkgs[idx].name = e.target.value;
                      setTokenPackages(newPkgs);
                    }}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-text-muted uppercase">Tokens</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-text-primary"
                        value={pkg.tokens}
                        onChange={(e) => {
                          const newPkgs = [...tokenPackages];
                          newPkgs[idx].tokens = parseInt(e.target.value) || 0;
                          setTokenPackages(newPkgs);
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-text-muted uppercase">Harga (Rp)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-text-primary"
                        value={pkg.price}
                        onChange={(e) => {
                          const newPkgs = [...tokenPackages];
                          newPkgs[idx].price = parseInt(e.target.value) || 0;
                          setTokenPackages(newPkgs);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              className="btn-primary px-6 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white"
              onClick={() => saveSetting("token_packages", tokenPackages)}
            >
              Simpan Paket Top-up
            </button>
          </div>

          {/* Subscription Plans */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-400" /> Paket Langganan (Monthly)</h3>
              <button 
                onClick={() => setSubscriptionPlans([...subscriptionPlans, { id: Date.now().toString(), name: "Plan Baru", price: 149000, description: "Dapatkan akses fitur premium", features: ["Akses Unlimited", "Priority Support"] }])}
                className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-text-secondary"
              >
                + Tambah Plan
              </button>
            </div>

            <div className="space-y-4">
              {subscriptionPlans.map((plan, idx) => (
                <div key={plan.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 relative group">
                  <button 
                    onClick={() => setSubscriptionPlans(subscriptionPlans.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 p-1 text-text-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 space-y-3">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-text-primary p-0"
                      value={plan.name}
                      onChange={(e) => {
                        const newPlans = [...subscriptionPlans];
                        newPlans[idx].name = e.target.value;
                        setSubscriptionPlans(newPlans);
                      }}
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase">Deskripsi</label>
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary h-16 resize-none"
                        value={plan.description}
                        onChange={(e) => {
                          const newPlans = [...subscriptionPlans];
                          newPlans[idx].description = e.target.value;
                          setSubscriptionPlans(newPlans);
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase">Harga (Rp/Bulan)</label>
                      <input 
                        type="number"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary font-bold"
                        value={plan.price}
                        onChange={(e) => {
                          const newPlans = [...subscriptionPlans];
                          newPlans[idx].price = parseInt(e.target.value) || 0;
                          setSubscriptionPlans(newPlans);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              className="btn-primary px-6 py-2 rounded-xl text-sm font-medium bg-indigo-500 text-white"
              onClick={() => saveSetting("subscription_plans", subscriptionPlans)}
            >
              Simpan Paket Langganan
            </button>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-semibold text-text-primary">Statistik Keuntungan</h3>
              <p className="text-xs text-text-muted">Grafik pendapatan otomatis dari Sakurupiah.id</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Total Pendapatan (Bulan Ini)</p>
              <p className="text-2xl font-bold text-emerald-400">Rp 4.250.000</p>
            </div>
          </div>
          
          <div className="h-64 flex items-end gap-2 pt-8">
            {/* Mock CSS Bar Chart */}
            {[40, 70, 30, 85, 50, 100, 60, 45, 80, 95].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative bg-white/5 rounded-t-sm h-[180px] flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500/20 to-emerald-400 rounded-t-sm transition-all duration-500 group-hover:from-emerald-400 group-hover:to-emerald-300"
                    style={{ height: `${val}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
                    {val * 12} TRX
                  </div>
                </div>
                <span className="text-[10px] text-text-muted">Tgl {i+1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
