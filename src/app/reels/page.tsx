"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  Share2,
  Wand2,
  Lock,
  Globe,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreVertical,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Reel {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string;
  videoUrl?: string;
  likes: number;
  isPublic: boolean;
  creator: string;
  creatorAvatar?: string;
  tags: string[];
  model: string;
  tool: string;
  resolution: string;
}

// Demo data — replace with Supabase query
const DEMO_REELS: Reel[] = [
  {
    id: "1",
    title: "Tokyo Neon Dreams",
    prompt: "Model fashion wanita cantik di kota Tokyo malam hari, neon lights, cinematic",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",
    likes: 1842,
    isPublic: true,
    creator: "AIRAXCreator",
    tags: ["fashion", "tokyo", "neon"],
    model: "veo-3-1",
    tool: "Shorts Creator",
    resolution: "9:16",
  },
  {
    id: "2",
    title: "Fitness Power",
    prompt: "Influencer fitness pria berotot di gym modern, dramatic lighting",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    likes: 976,
    isPublic: true,
    creator: "GymKing",
    tags: ["fitness", "gym", "power"],
    model: "sora-2",
    tool: "Chatbot",
    resolution: "9:16",
  },
  {
    id: "3",
    title: "Paris Style",
    prompt: "Street style photographer di Paris, golden hour, Eiffel Tower backdrop",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
    likes: 3102,
    isPublic: true,
    creator: "ParisVibes",
    tags: ["paris", "street", "fashion"],
    model: "nano-banana-pro",
    tool: "Infinity Canvas",
    resolution: "9:16",
  },
];

function ReelCard({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(reel.likes);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPublic, setIsPublic] = useState(reel.isPublic);
  const router = useRouter();
  const supabase = createClient();

  async function handleLike() {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    if (!liked) {
      // Send notification to DB
      await supabase.from("notifications").insert({
        title: "Karya Anda Disukai! ❤️",
        message: `@User menyukai video "${reel.title}" Anda.`,
        status: "like",
        category: "social",
        is_active: true
      });
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: reel.prompt,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      // alert("Link video telah tersalin ke clipboard! 🔗");
    }
  }

  async function handleSave() {
    setSaved(!saved);
    if (!saved) {
      await supabase.from("notifications").insert({
        title: "Konten Disimpan! 🔖",
        message: `Konten "${reel.title}" telah disimpan ke koleksi Anda.`,
        status: "save",
        category: "social",
        is_active: true
      });
    }
  }

  function handleRemix() {
    // Pass prompt and model to respective tools
    const path = reel.tool === "Shorts Creator" ? "/shorts" : reel.tool === "Infinity Canvas" ? "/canvas" : "/chat";
    router.push(`${path}?prompt=${encodeURIComponent(reel.prompt)}&model=${reel.model}`);
  }

  function formatCount(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }

  return (
    <div className="relative w-full h-full flex-shrink-0 overflow-hidden">
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reel.imageUrl}
        alt={reel.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: isActive ? "none" : "brightness(0.4)" }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Play/Pause tap */}
      <button
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? "Pause" : "Play"}
      />

      {/* Play indicator */}
      {!playing && isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
        {/* Privacy badge */}
        <button
          id={`reel-privacy-${reel.id}`}
          onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm
            bg-black/40 border border-white/20 text-xs text-white font-medium cursor-pointer
            hover:bg-black/60 transition-colors"
        >
          {isPublic ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              Publik
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              Privat
            </>
          )}
        </button>

        {/* Mute */}
        <button
          id={`reel-mute-${reel.id}`}
          onClick={() => setMuted(!muted)}
          className="w-9 h-9 rounded-full backdrop-blur-sm bg-black/40 border border-white/20
            flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors z-30"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Privacy Menu */}
      {showPrivacyMenu && (
        <div className="absolute top-16 left-4 z-40 glass-strong rounded-xl border border-white/15 overflow-hidden shadow-2xl">
          <button
            onClick={() => {
              setIsPublic(true);
              setShowPrivacyMenu(false);
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-white/10 transition-colors w-full cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            Publik
          </button>
          <button
            onClick={() => {
              setIsPublic(false);
              setShowPrivacyMenu(false);
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-white/10 transition-colors w-full cursor-pointer"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Privat
          </button>
        </div>
      )}

      {/* Right Action Bar */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5 z-30">
        {/* Like */}
        <button
          id={`reel-like-${reel.id}`}
          onClick={handleLike}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
              ${liked ? "bg-rose-500/30 scale-110" : "bg-black/40 backdrop-blur-sm hover:bg-black/60"}`}
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${
                liked ? "text-rose-400 fill-rose-400 scale-110" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs text-white font-medium">
            {formatCount(likeCount)}
          </span>
        </button>

        {/* Share */}
        <button
          id={`reel-share-${reel.id}`}
          onClick={handleShare}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white font-medium">Share</span>
        </button>

        {/* Remix */}
        <button
          id={`reel-remix-${reel.id}`}
          onClick={handleRemix}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
            bg-gradient-to-br from-accent-primary to-accent-secondary hover:scale-110 shadow-lg"
          >
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white font-medium">Remix</span>
        </button>

        {/* Save */}
        <button
          id={`reel-save-${reel.id}`}
          onClick={handleSave}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
            <Bookmark
              className={`w-6 h-6 transition-all ${
                saved ? "text-amber-400 fill-amber-400" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs text-white font-medium">Simpan</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-8 left-4 right-20 z-30">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xs font-bold">
            {reel.creator[0]}
          </div>
          <span className="text-sm font-semibold text-white">
            @{reel.creator}
          </span>
        </div>

        <h3 className="text-white font-bold text-base mb-1">{reel.title}</h3>
        
        {/* Model & Tool Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent-primary/20 border border-accent-primary/30">
            <Wand2 className="w-3 h-3 text-accent-primary" />
            <span className="text-[10px] font-bold text-white uppercase">{reel.model}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 border border-white/15">
            <Play className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white uppercase">{reel.tool}</span>
          </div>
        </div>

        <div className="relative">
          <p className={`text-white/70 text-xs leading-relaxed mb-3 cursor-pointer ${!showPrompt && "line-clamp-2"}`} onClick={() => setShowPrompt(!showPrompt)}>
            {reel.prompt}
          </p>
          {!showPrompt && reel.prompt.length > 80 && (
            <span className="text-[10px] text-accent-primary font-bold absolute bottom-3 right-0 bg-gradient-to-l from-black px-2 cursor-pointer" onClick={() => setShowPrompt(true)}>...Selengkapnya</span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {reel.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReelsGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredReels = DEMO_REELS.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Scroll snap detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onScroll() {
      if (!container) return;
      const idx = Math.round(container.scrollTop / container.clientHeight);
      setCurrentIdx(idx);
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="glass-strong border border-white/15 rounded-2xl flex items-center px-4 py-2.5 shadow-2xl">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau hashtag..." 
            className="flex-1 bg-transparent border-none text-white text-sm placeholder-white/40 focus:ring-0 outline-none"
          />
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
            🔍
          </div>
        </div>
      </div>

      {/* Reels Feed */}
      <div
        ref={containerRef}
        id="reels-feed"
        className="flex-1 overflow-y-scroll no-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {filteredReels.map((reel, idx) => (
          <div
            key={reel.id}
            id={`reel-item-${reel.id}`}
            className="relative w-full"
            style={{
              height: "100%",
              minHeight: "100%",
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
            }}
          >
            <ReelCard reel={reel} isActive={idx === currentIdx} />
          </div>
        ))}
        {filteredReels.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl mb-6 grayscale">🎬</div>
            <h2 className="text-xl font-bold text-white mb-2">Konten Tidak Ditemukan</h2>
            <p className="text-white/60 text-sm">Coba kata kunci lain atau hapus pencarian.</p>
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="hidden lg:flex flex-col items-center justify-center gap-2 w-12 py-8">
        {DEMO_REELS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              containerRef.current?.scrollTo({
                top: idx * (containerRef.current?.clientHeight ?? 0),
                behavior: "smooth",
              });
            }}
            className={`rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIdx
                ? "w-2 h-6 bg-accent-primary"
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
