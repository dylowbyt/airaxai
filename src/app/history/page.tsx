"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Film,
  Zap,
  Image as ImageIcon,
  ChevronRight,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HistoryItem {
  id: string;
  type: "shorts" | "reels" | "image";
  title: string;
  prompt: string;
  status: string;
  created_at: string;
  thumbnail_url: string | null;
  reference_id: string | null;
}

function TypeIcon({ type }: { type: string }) {
  if (type === "shorts") return <Zap className="w-4 h-4 text-accent-primary" />;
  if (type === "reels") return <Film className="w-4 h-4 text-accent-cyan" />;
  return <ImageIcon className="w-4 h-4 text-accent-secondary" />;
}

function TypeLabel({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    shorts: { label: "Shorts", cls: "bg-accent-primary/20 text-accent-primary border-accent-primary/30" },
    reels: { label: "Reels", cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    image: { label: "Gambar", cls: "bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30" },
  };
  const info = map[type] || map.image;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${info.cls}`}>
      {info.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
        Selesai
      </span>
    );
  if (status === "failed")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium">
        Gagal
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium animate-pulse">
      Proses...
    </span>
  );
}

export default function HistoryPage() {
  const supabase = createClient();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data) setHistory(data as HistoryItem[]);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase()) || 
    item.prompt?.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemClick = (item: HistoryItem) => {
    if (item.thumbnail_url) {
      window.open(item.thumbnail_url, "_blank");
    } else if (item.reference_id) {
      // Redirect to the specific creation page if needed
      if (item.type === "shorts") window.location.href = `/shorts?id=${item.reference_id}`;
      else if (item.type === "reels") window.location.href = `/reels?id=${item.reference_id}`;
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent-primary" />
            Riwayat Kreasi
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Semua konten yang pernah kamu buat
          </p>
        </div>
        {/* Filter bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Cari riwayat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl
              text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/50 w-52"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
          <p className="text-text-muted">Memuat riwayat...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/8
                hover:border-accent-primary/40 hover:bg-white/5 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/5 to-accent-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/40 relative">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title || "Creation"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon type={item.type} />
                  </div>
                )}
                {item.status === "completed" && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-text-primary truncate">{item.title || "Tanpa Judul"}</h4>
                </div>
                <p className="text-[11px] text-text-muted truncate italic">"{item.prompt}"</p>
                <p className="text-[10px] text-text-muted mt-1 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <TypeLabel type={item.type} />
                  <StatusBadge status={item.status} />
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-all group-hover:translate-x-1" />
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div className="glass rounded-[2rem] p-16 text-center border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-text-muted/30" />
              </div>
              <p className="text-text-muted font-medium">Belum ada riwayat kreasi</p>
              <p className="text-xs text-text-muted/60 mt-1">Mulai buat karya pertamamu sekarang!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
