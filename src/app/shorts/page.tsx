"use client";

import { useState } from "react";
import {
  Sparkles,
  Zap,
  Image as ImageIcon,
  Video,
  Type,
  Download,
  RefreshCw,
  ChevronRight,
  Wand2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Globe,
} from "lucide-react";

type Step = "prompt" | "image" | "video" | "caption" | "publish";

interface GenerationState {
  prompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string;
  captionPosition: "top" | "center" | "bottom";
  captionStyle: "bold" | "outline" | "glow";
  title: string;
  description: string;
  hashtags: string;
}

const STEP_ORDER: Step[] = ["prompt", "image", "video", "caption", "publish"];

const stepInfo = {
  prompt: {
    label: "Input Prompt",
    icon: <Wand2 className="w-5 h-5" />,
    desc: "Deskripsikan konten yang ingin kamu buat",
  },
  image: {
    label: "Generate Gambar",
    icon: <ImageIcon className="w-5 h-5" />,
    desc: "AI membuat gambar dari promptmu (DALL-E 3)",
  },
  video: {
    label: "Animasi Video",
    icon: <Video className="w-5 h-5" />,
    desc: "Gambar dianimasikan jadi video 9:16 (Runway)",
  },
  caption: {
    label: "Caption Otomatis",
    icon: <Type className="w-5 h-5" />,
    desc: "Tambahkan teks overlay di video",
  },
  publish: {
    label: "Publikasi",
    icon: <Globe className="w-5 h-5" />,
    desc: "Tambahkan deskripsi & hashtag",
  },
};

const samplePrompts = [
  "Model fashion wanita cantik di kota Tokyo malam hari, neon lights, cinematic",
  "Influencer fitness pria berotot di gym modern, dramatic lighting",
  "Beauty influencer di studio mewah dengan flowers background, natural light",
  "Street style photographer di Paris, golden hour, Eiffel Tower backdrop",
];

export default function ShortsPage() {
  const [currentStep, setCurrentStep] = useState<Step>("prompt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GenerationState>({
    prompt: "",
    imageUrl: null,
    videoUrl: null,
    caption: "",
    captionPosition: "bottom",
    captionStyle: "bold",
    title: "",
    description: "",
    hashtags: "#ai #shorts #airax",
  });
  const [resolution, setResolution] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [duration, setDuration] = useState(5);
  const [videoModel, setVideoModel] = useState<"veo-3-1" | "sora-2">("veo-3-1");

  const currentStepIdx = STEP_ORDER.indexOf(currentStep);

  async function handleGenerateImage() {
    if (!state.prompt.trim()) {
      setError("Masukkan prompt terlebih dahulu!");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Call our API route which calls DALL-E 3
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: state.prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate gambar");
      setState((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setCurrentStep("video");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateVideo() {
    if (!state.imageUrl) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: state.imageUrl,
          prompt: state.prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate video");
      setState((prev) => ({ ...prev, videoUrl: data.videoUrl }));

      // Auto-generate caption
      const captionRes = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: state.prompt }),
      });
      const captionData = await captionRes.json();
      if (captionRes.ok) {
        setState((prev) => ({
          ...prev,
          caption: captionData.caption || state.prompt,
        }));
      }

      setCurrentStep("caption");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setCurrentStep("prompt");
    setState({
      prompt: "",
      imageUrl: null,
      videoUrl: null,
      caption: "",
      captionPosition: "bottom",
      captionStyle: "bold",
      title: "",
      description: "",
      hashtags: "#ai #shorts #airax",
    });
    setError(null);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent-primary" />
          YouTube Shorts Creator
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Produksi video vertikal 9:16 bertenaga AI — dari prompt ke video siap
          upload dalam hitungan menit.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEP_ORDER.map((step, idx) => {
          const isDone = idx < currentStepIdx;
          const isActive = step === currentStep;
          const info = stepInfo[step];
          return (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? "bg-accent-primary/20 border-accent-primary/40 text-accent-primary"
                    : isDone
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-text-muted"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <span className="flex-shrink-0">{info.icon}</span>
                )}
                <span className="text-xs font-medium hidden sm:block">
                  {info.label}
                </span>
              </div>
              {idx < STEP_ORDER.length - 1 && (
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* Step: Prompt */}
          {currentStep === "prompt" && (
            <div className="space-y-4">
              <div className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary">
                    Deskripsikan Kontenmu
                  </h3>
                </div>
                <textarea
                  id="shorts-prompt-input"
                  value={state.prompt}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, prompt: e.target.value }))
                  }
                  placeholder="Contoh: Model fashion wanita cantik di kota Tokyo malam hari, neon lights, cinematic quality, 9:16 vertical..."
                  className="w-full h-36 bg-white/5 border border-white/10 rounded-xl p-4 text-sm
                    text-text-primary placeholder-text-muted resize-none focus:outline-none
                    focus:border-accent-primary/50 transition-all duration-200 leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{state.prompt.length} karakter</span>
                  <span>Semakin detail = hasil lebih baik</span>
                </div>
              </div>

              {/* Resolution & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-xl space-y-3">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Resolusi Video</label>
                  <div className="flex gap-2">
                    {["9:16", "16:9", "1:1"].map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res as any)}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                          resolution === res ? "bg-accent-primary/20 border-accent-primary text-white" : "bg-white/5 border-white/10 text-text-muted"
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="glass p-4 rounded-xl space-y-3">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Durasi Video (Detik)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" min="3" max="15" step="1" 
                      value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="flex-1 accent-accent-primary"
                    />
                    <span className="text-sm font-bold text-accent-primary w-8">{duration}s</span>
                  </div>
                  <p className="text-[10px] text-text-muted italic">Biaya: {duration} Token ({duration}s x 1/dtk)</p>
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="glass p-5 rounded-2xl space-y-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                  Contoh Prompt
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      id={`sample-prompt-${i}`}
                      onClick={() =>
                        setState((prev) => ({ ...prev, prompt: p }))
                      }
                      className="text-left text-xs px-3 py-2.5 rounded-lg bg-white/5 border border-white/8
                        hover:border-accent-primary/30 hover:bg-accent-primary/10 text-text-secondary
                        hover:text-text-primary transition-all duration-200 cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="shorts-generate-image-btn"
                onClick={handleGenerateImage}
                disabled={loading || !state.prompt.trim()}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? "Generating..." : "Generate Gambar dengan DALL-E 3"}
              </button>
            </div>
          )}

          {/* Step: Image */}
          {currentStep === "video" && state.imageUrl && (
            <div className="space-y-4">
              <div className="glass p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary">
                    Gambar Berhasil Dibuat!
                  </h3>
                </div>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.imageUrl}
                    alt="AI Generated"
                    className="rounded-xl max-h-80 object-contain border border-white/10 shadow-2xl"
                  />
                </div>
                <p className="text-xs text-text-muted text-center mt-3">
                  {state.prompt}
                </p>
              </div>

              <button
                id="shorts-generate-video-btn"
                onClick={handleGenerateVideo}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
                {loading
                  ? "Menganimasikan dengan Runway..."
                  : "Animasikan ke Video 9:16"}
              </button>

              <button
                onClick={() => setCurrentStep("prompt")}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Buat Gambar Baru
              </button>
            </div>
          )}

          {/* Step: Caption */}
          {currentStep === "caption" && (
            <div className="space-y-4">
              <div className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-5 h-5 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary">
                    Caption Otomatis
                  </h3>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">
                    Teks Caption
                  </label>
                  <textarea
                    id="shorts-caption-input"
                    value={state.caption}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, caption: e.target.value }))
                    }
                    className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm
                      text-text-primary placeholder-text-muted resize-none focus:outline-none
                      focus:border-accent-primary/50 transition-all duration-200"
                  />
                </div>

                {/* Caption Position */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">
                    Posisi Caption
                  </label>
                  <div className="flex gap-2">
                    {(["top", "center", "bottom"] as const).map((pos) => (
                      <button
                        key={pos}
                        id={`caption-pos-${pos}`}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            captionPosition: pos,
                          }))
                        }
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all cursor-pointer ${
                          state.captionPosition === pos
                            ? "bg-accent-primary/20 border-accent-primary/40 text-accent-primary"
                            : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        {pos === "top"
                          ? "Atas"
                          : pos === "center"
                          ? "Tengah"
                          : "Bawah"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption Style */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">
                    Gaya Teks
                  </label>
                  <div className="flex gap-2">
                    {(["bold", "outline", "glow"] as const).map((style) => (
                      <button
                        key={style}
                        id={`caption-style-${style}`}
                        onClick={() =>
                          setState((prev) => ({ ...prev, captionStyle: style }))
                        }
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all cursor-pointer capitalize ${
                          state.captionStyle === style
                            ? "bg-accent-secondary/20 border-accent-secondary/40 text-accent-secondary"
                            : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                id="shorts-download-btn"
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Video Shorts
              </button>

              <button
                onClick={() => setCurrentStep("publish")}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                Lanjut ke Publikasi
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                id="shorts-reset-btn"
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Buat Shorts Baru
              </button>
            </div>
          )}

          {/* Step: Publish */}
          {currentStep === "publish" && (
            <div className="space-y-4">
              <div className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary">Detail Publikasi</h3>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">Judul Konten</label>
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Judul video yang menarik..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-text-primary focus:border-accent-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">Deskripsi & Hashtag</label>
                  <textarea
                    value={state.description}
                    onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tulis deskripsi konten..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-text-primary focus:border-accent-primary outline-none resize-none"
                  />
                  <input
                    type="text"
                    value={state.hashtags}
                    onChange={(e) => setState(prev => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="#hashtag #ai #reels"
                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-accent-primary font-medium focus:border-accent-primary outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => alert("Konten berhasil dipublikasikan ke Gallery!")}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-bold hover:scale-[1.02] transition-all shadow-xl shadow-accent-primary/25 flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5" />
                Publikasikan ke Gallery
              </button>

              <button
                onClick={() => setCurrentStep("caption")}
                className="w-full btn-secondary py-3 text-sm"
              >
                Kembali ke Caption
              </button>
            </div>
          )}
        </div>

        {/* Preview Panel — 9:16 */}
        <div className="lg:col-span-2">
          <div className="sticky top-0">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              Preview 9:16
            </p>
            <div
              className="relative w-full glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ aspectRatio: "9/16", maxHeight: "520px" }}
            >
              {/* Background */}
              {state.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.imageUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #06060e 0%, #131340 100%)",
                  }}
                >
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center animate-float">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-text-muted text-xs">
                      Preview muncul setelah
                      <br />
                      generate gambar
                    </p>
                  </div>
                </div>
              )}

              {/* Gradient overlay */}
              {state.imageUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)",
                  }}
                />
              )}

              {/* Video indicator */}
              {state.videoUrl && (
                <div className="absolute top-3 left-3">
                  <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500 text-white font-semibold">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    VIDEO
                  </span>
                </div>
              )}

              {/* Caption Overlay */}
              {state.caption && (
                <div
                  className={`absolute left-3 right-3 ${
                    state.captionPosition === "top"
                      ? "top-16"
                      : state.captionPosition === "center"
                      ? "top-1/2 -translate-y-1/2"
                      : "bottom-16"
                  }`}
                >
                  <p
                    className={`text-white text-sm text-center font-bold leading-snug px-2 py-1 rounded-lg
                      ${
                        state.captionStyle === "bold"
                          ? "bg-black/50"
                          : state.captionStyle === "outline"
                          ? "[text-shadow:0_0_4px_black,0_0_8px_black]"
                          : "[text-shadow:0_0_8px_rgba(99,102,241,0.9),0_0_20px_rgba(99,102,241,0.6)]"
                      }`}
                  >
                    {state.caption}
                  </p>
                </div>
              )}

              {/* Shorts badge */}
              <div className="absolute bottom-3 right-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-black/60 text-white/70 border border-white/20">
                  9:16 • Shorts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
