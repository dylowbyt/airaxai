import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, Coins } from "lucide-react";

export const metadata = {
  title: "Profil Saya — AIRAX AI",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let profile = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch (err) {
    // If profiles table doesn't exist yet, graceful fallback
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const userRole = profile?.user_role || "user";
  const tokens = profile?.tokens || 0;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Profil Saya</h1>
        <p className="text-text-secondary text-sm">
          Kelola informasi akun dan preferensi Anda
        </p>
      </div>

      <div className="glass p-8 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent-primary/20 flex-shrink-0 bg-white/5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{fullName}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 text-text-muted mt-1">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
              <Shield className={`w-4 h-4 ${userRole === 'admin' ? 'text-accent-primary' : 'text-text-muted'}`} />
              <span className="capitalize text-text-secondary">{userRole}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-400">{tokens.toLocaleString('id-ID')} Token</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
