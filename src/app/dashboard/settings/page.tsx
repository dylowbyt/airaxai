"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Save, UserCircle, Shield, Sparkles, Check, Loader2 } from "lucide-react";
import Image from "next/image";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aria",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Max",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zane",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nova",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Glow",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Flux",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nebula",
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    avatar_url: "",
    user_role: "user",
  });
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            avatar_url: data.avatar_url || "",
            user_role: data.user_role || "user",
          });
        }
      }
      setLoading(false);
    }
    getProfile();
  }, [supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Gagal memperbarui profil: " + error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Pengaturan</h1>
        <p className="text-text-secondary">Kelola profil dan preferensi akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-accent-primary" />
              Edit Profil
            </h2>

            {/* Current Avatar Preview */}
            <div className="flex flex-col items-center gap-4 py-4 border-b border-white/5">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-accent-primary/20 bg-white/5 shadow-xl shadow-accent-primary/10">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt="Current Avatar" 
                    fill 
                    className="object-cover"
                    unoptimized={profile.avatar_url.includes('.svg')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5 text-text-muted">
                    <UserCircle className="w-12 h-12" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Pratinjau Profil</p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Nama Lengkap (Display Name)</label>
              <input 
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-accent-primary outline-none transition-all"
                placeholder="Masukkan nama Anda"
              />
            </div>

            {/* Avatar Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-text-secondary">Pilih Avatar Preset (Tema AI)</label>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_AVATARS.map((url) => (
                  <button
                    key={url}
                    onClick={() => setProfile({ ...profile, avatar_url: url })}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      profile.avatar_url === url 
                        ? "border-accent-primary bg-accent-primary/20 scale-105 shadow-lg shadow-accent-primary/20" 
                        : "border-white/5 hover:border-white/20 bg-white/5"
                    }`}
                  >
                    <Image 
                      src={url} 
                      alt="Avatar" 
                      fill 
                      className="p-1" 
                      unoptimized 
                    />
                    {profile.avatar_url === url && (
                      <div className="absolute top-1 right-1 bg-accent-primary rounded-full p-0.5 shadow-md">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-5 h-5" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Developer Card (Task 4) */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-accent-primary/20 bg-gradient-to-br from-accent-primary/5 to-transparent relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent-primary/10 blur-3xl rounded-full transition-all group-hover:scale-150" />
            
            <div className="relative z-10 space-y-4 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary p-0.5 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#0a0a16] flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="Developer" 
                    width={80} 
                    height={80} 
                    className="opacity-80 p-2"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">ANDI PEBRIANTO</h3>
                <p className="text-accent-primary text-xs font-bold uppercase tracking-widest mt-1">CEO & LEAD DEVELOPER</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 italic text-[11px] text-text-secondary leading-relaxed">
                "Membangun ekosistem kecerdasan buatan dan alat kreator generasi terbaru."
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <div className="px-2 py-1 bg-accent-cyan/10 rounded text-[9px] font-bold text-accent-cyan border border-accent-cyan/20 uppercase">Innovator</div>
                <div className="px-2 py-1 bg-emerald-500/10 rounded text-[9px] font-bold text-emerald-400 border border-emerald-500/20 uppercase">Fullstack</div>
              </div>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold">Status Akun</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Role</span>
                <span className="text-white font-medium capitalize">{profile.user_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Email</span>
                <span className="text-white font-medium truncate max-w-[120px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
