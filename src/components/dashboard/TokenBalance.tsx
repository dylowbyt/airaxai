"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TokenBalance() {
  const [tokens, setTokens] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("tokens")
        .eq("id", user.id)
        .single();

      if (data) setTokens(data.tokens);
    }

    fetchTokens();

    // Refresh token balance every 30 seconds
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  if (tokens === null) return null;

  return (
    <Link
      href="/topup"
      id="header-token-balance"
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10
        border border-amber-500/25 hover:border-amber-500/40 transition-all duration-200 group"
      title="Top Up Token"
    >
      <div className="flex items-center gap-1.5">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-amber-300">
          {tokens.toLocaleString("id-ID")}
        </span>
      </div>
      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
        <Plus className="w-3 h-3 text-amber-400" />
      </div>
    </Link>
  );
}
