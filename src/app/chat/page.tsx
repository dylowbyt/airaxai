"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Image as ImageIcon,
  Wand2,
  Paperclip,
  Download,
  Loader2,
  Plus,
  MessageSquare,
  MoreVertical,
  Trash2,
  X,
  Menu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface MediaResult {
  type: "image" | "video";
  url: string;
  prompt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_url?: string | null;
  media_result?: MediaResult | null;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [chatMode, setChatMode] = useState<"chat" | "image" | "video">("chat");
  const [textModel, setTextModel] = useState("gpt-4o-mini");
  const [imageModel, setImageModel] = useState("nano-banana-2");
  const [videoModel, setVideoModel] = useState("sora-2");

  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [resolution, setResolution] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [duration, setDuration] = useState(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, isOptimizing]);

  // Load Sessions
  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setSessions(data);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load Messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();
  }, [activeSessionId]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setAttachedImage(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_sessions").delete().eq("id", id);
    if (activeSessionId === id) handleNewChat();
    loadSessions();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const optimizePrompt = async () => {
    if (!input.trim()) return;
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (data.optimizedPrompt) {
        setInput(data.optimizedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isSending) return;

    const currentInput = input;
    const currentImg = attachedImage;
    
    setInput("");
    setAttachedImage(null);

    const tempId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: currentInput,
      image_url: currentImg
    };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setIsSending(true);

    try {
      // Prepare messages for API
      const apiMessages = messages.map(m => {
        if (m.image_url) {
          return {
            role: m.role,
            content: [
              { type: "text", text: m.content },
              { type: "image_url", image_url: { url: m.image_url } }
            ]
          };
        }
        return { role: m.role, content: m.content };
      });
      
      const payloadLastMsg = currentImg 
        ? { role: "user", content: [{ type: "text", text: currentInput }, { type: "image_url", image_url: { url: currentImg } }] }
        : { role: "user", content: currentInput };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMessages, payloadLastMsg],
          sessionId: activeSessionId,
          isVision: !!currentImg || apiMessages.some(m => Array.isArray(m.content)),
          mode: chatMode,
          model: chatMode === "image" ? imageModel : chatMode === "video" ? videoModel : textModel,
          prompt: currentInput
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim pesan");

      // Set session if new
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
        loadSessions();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ast",
          role: "assistant",
          content: data.content,
          media_result: data.mediaResult
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `❌ Error: ${err.message}` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };

  return (
    <div className="flex h-full relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat History Sidebar */}
      <div 
        className={`absolute lg:relative w-72 h-full bg-bg-secondary border-r border-white/10 z-30 transition-transform duration-300 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button 
            onClick={handleNewChat}
            className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Chat Baru
          </button>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="ml-2 p-2 text-text-muted hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => { setActiveSessionId(session.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                ${activeSessionId === session.id 
                  ? "bg-accent-primary/20 border border-accent-primary/30 text-accent-primary" 
                  : "hover:bg-white/5 text-text-secondary border border-transparent"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === session.id ? "text-accent-primary" : "text-text-muted"}`} />
                <span className="text-sm font-medium truncate">{session.title}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-rose-500/20 text-text-muted hover:text-rose-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-center text-text-muted mt-6">Belum ada percakapan.</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-bg-primary relative">
        {/* Chat Header */}
        <div className="h-14 border-b border-white/10 flex items-center px-4 glass sticky top-0 z-10 shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 mr-2 -ml-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">AIRAX Assistant</h2>
              <p className="text-[10px] text-emerald-400 font-medium">● Online — GPT-4o</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 && !isSending && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-primary mb-2 shadow-lg glow-lg">
                <Wand2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Bagaimana saya bisa membantu?</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Tulis ide kontenmu, upload gambar referensi, atau minta saya untuk membuat prompt gambar profesional.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Buatkan prompt fashion shoot di Paris", "Generate gambar cyberpunk city", "Bantu ide konten TikTok"].map(hint => (
                  <button 
                    key={hint} 
                    onClick={() => setInput(hint)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 
                  ${msg.role === "user" ? "bg-white/10 border border-white/20" : "bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg"}`}>
                  {msg.role === "user" ? <span className="text-xs font-bold">You</span> : <Wand2 className="w-4 h-4 text-white" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-4 rounded-2xl shadow-md text-sm ${
                    msg.role === "user" 
                      ? "bg-accent-primary text-white rounded-tr-sm" 
                      : "bg-white/5 border border-white/10 text-text-primary rounded-tl-sm glass"
                  }`}>
                    
                    {/* Uploaded Image */}
                    {msg.image_url && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-w-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.image_url} alt="Uploaded" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {/* Markdown Text */}
                    {msg.content && (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Generated Media (Image/Video) */}
                    {msg.media_result && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-white/15 bg-black/40 relative group max-w-sm">
                        {msg.media_result.type === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.media_result.url} alt="Generated UI" className="w-full h-auto" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <button 
                            onClick={() => downloadImage(msg.media_result!.url, "airax-generated.png")}
                            className="btn-primary py-1.5 px-3 text-xs flex items-center justify-center gap-2 mt-auto"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center mt-1">
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-text-primary rounded-tl-sm glass flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce delay-75" />
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 glass border-t border-white/10 shrink-0 relative">
          <div className="max-w-4xl mx-auto relative">
            
            {/* Image Preview Attachment */}
            {attachedImage && (
              <div className="absolute bottom-full left-0 mb-4 p-2 bg-bg-card border border-white/10 rounded-xl shadow-2xl flex items-start gap-2">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setChatMode("chat")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chatMode === "chat" ? "bg-accent-primary text-white" : "text-text-muted hover:text-white"}`}
                >
                  💬 Chat
                </button>
                <button 
                  onClick={() => setChatMode("image")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chatMode === "image" ? "bg-cyan-500 text-white" : "text-text-muted hover:text-white"}`}
                >
                  🎨 Image
                </button>
                <button 
                  onClick={() => setChatMode("video")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chatMode === "video" ? "bg-indigo-500 text-white" : "text-text-muted hover:text-white"}`}
                >
                  🎬 Video
                </button>
              </div>

              {chatMode === "chat" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <select 
                      value={textModel} 
                      onChange={(e) => setTextModel(e.target.value)}
                      className="bg-black/40 text-[11px] text-white border border-white/10 rounded-lg p-1.5 focus:border-accent-primary outline-none w-40"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Free)</option>
                      <option value="GPT-5.4">GPT-5.4 (1 Token)</option>
                    </select>
                    {textModel === "GPT-5.4" && (
                      <span className="text-[10px] text-amber-400 animate-pulse bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 font-bold uppercase tracking-wider">
                        Ultra High Intelligence
                      </span>
                    )}
                  </div>
                  {textModel === "GPT-5.4" && (
                    <div className="text-[9px] text-text-muted bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">
                      🚀 <span className="text-amber-400 font-semibold">GPT-5.4 Mode:</span> Mampu menghasilkan prompt hiper-realistik, kontrol pencahayaan sinematik, dan instruksi frame-by-frame untuk video AI (Sora/Veo).
                    </div>
                  )}
                </div>
              )}
              {chatMode === "image" && (
                <div className="flex items-center gap-2">
                  <select 
                    value={imageModel} 
                    onChange={(e) => setImageModel(e.target.value)}
                    className="bg-black/40 text-[11px] text-white border border-white/10 rounded-lg p-1.5 focus:border-cyan-500 outline-none w-32"
                  >
                    <option value="nanobanana">Nano Banana</option>
                    <option value="nano-banana-2">Nano Banana 2</option>
                    <option value="nano-banana-pro">Nano Pro</option>
                  </select>
                  <select 
                    value={resolution} 
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="bg-black/40 text-[11px] text-white border border-white/10 rounded-lg p-1.5 focus:border-cyan-500 outline-none w-24"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Wide</option>
                    <option value="9:16">9:16 Portrait</option>
                  </select>
                </div>
              )}
              {chatMode === "video" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <select 
                      value={videoModel} 
                      onChange={(e) => setVideoModel(e.target.value)}
                      className="bg-black/40 text-[11px] text-white border border-white/10 rounded-lg p-1.5 focus:border-indigo-500 outline-none w-28"
                    >
                      <option value="sora-2">Sora 2</option>
                      <option value="veo-3">Veo 3</option>
                      <option value="veo-3-1">Veo 3.1</option>
                    </select>
                    <select 
                      value={resolution} 
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="bg-black/40 text-[11px] text-white border border-white/10 rounded-lg p-1.5 focus:border-indigo-500 outline-none w-24"
                    >
                      <option value="9:16">9:16 Port</option>
                      <option value="16:9">16:9 Wide</option>
                      <option value="1:1">1:1 Sq</option>
                    </select>
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg p-1">
                      <span className="text-[10px] text-text-muted px-1">Durasi:</span>
                      <input 
                        type="number" min="3" max="15" 
                        value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-10 bg-transparent text-[11px] text-accent-secondary font-bold text-center outline-none"
                      />
                      <span className="text-[10px] text-text-muted pr-1">s</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-text-muted flex justify-between px-1">
                    <span>Model: {videoModel.toUpperCase()}</span>
                    <span>Biaya: <span className="text-accent-secondary font-bold">{duration} Token</span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex items-end gap-2 bg-bg-card border border-white/15 rounded-2xl p-2 shadow-inner focus-within:border-accent-primary/50 focus-within:ring-1 focus-within:ring-accent-primary/50 transition-all">
              
              {/* Attachment Button */}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors mb-0.5 shrink-0"
                title="Upload Gambar/Media (Vision)"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ketik pesan atau / untuk commands..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-primary placeholder-text-muted resize-none max-h-32 min-h-[44px] py-3 px-2 leading-relaxed"
                rows={1}
                style={{ height: "auto" }}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-1 mb-0.5 shrink-0">
                {/* Optimize Prompt Button */}
                <button
                  onClick={optimizePrompt}
                  disabled={!input.trim() || isOptimizing}
                  className="p-2.5 rounded-xl text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50 group relative"
                  title="Professional Prompt Assistant"
                >
                  {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {/* Tooltip */}
                  <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-xs text-center text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Otomatis rapikan & optimalkan prompt
                  </span>
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedImage) || isSending}
                  className="p-2.5 rounded-xl bg-accent-primary text-white hover:bg-accent-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-primary/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-text-muted mt-2">
              AIRAX Assistant dapat memproses gambar, memperbaiki prompt, dan menghasilkan visual secara langsung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
