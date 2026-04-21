"use client";

import { createClient } from "@/lib/supabase/client";
import { LogIn } from "lucide-react";

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      id="login-button"
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
        bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20
        text-white transition-all duration-300 hover:-translate-y-0.5
        backdrop-blur-sm cursor-pointer"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">Login with Google</span>
      <span className="sm:hidden">Login</span>
    </button>
  );
}
