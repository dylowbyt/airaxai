"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, AlertTriangle, Gift, Info, Heart, Bookmark, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  type Notification,
  type NotificationStatus,
  getNotificationColor,
} from "@/lib/supabase/notifications";

function StatusIcon({ status }: { status: NotificationStatus }) {
  if (status === "maintenance") return <AlertTriangle className="w-4 h-4 text-rose-400" />;
  if (status === "promo") return <Gift className="w-4 h-4 text-emerald-400" />;
  if (status === "like") return <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />;
  if (status === "save") return <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400" />;
  if (status === "social") return <Users className="w-4 h-4 text-cyan-400" />;
  return <Info className="w-4 h-4 text-indigo-400" />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"system" | "social">("system");
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch & subscribe to real-time notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data as Notification[]);
        const stored = JSON.parse(
          localStorage.getItem("airax_read_notifs") || "[]"
        );
        const readSet = new Set<string>(stored);
        setReadIds(readSet);
        setUnreadCount(
          (data as Notification[]).filter((n) => !readSet.has(n.id)).length
        );
      }
    }

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleOpen() {
    setOpen((prev) => !prev);
    // Mark all as read
    if (!open) {
      const allIds = notifications.map((n) => n.id);
      const newReadIds = new Set([...readIds, ...allIds]);
      setReadIds(newReadIds);
      setUnreadCount(0);
      localStorage.setItem(
        "airax_read_notifs",
        JSON.stringify([...newReadIds])
      );
    }
  }

  const hasMaintenance = notifications.some((n) => n.status === "maintenance");
  const filteredNotifications = notifications.filter(n => (n.category || 'system') === activeTab);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        className={`relative p-2.5 rounded-xl transition-all duration-300 cursor-pointer
          ${hasMaintenance
            ? "bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30"
            : "hover:bg-white/10 border border-transparent hover:border-white/10"
          }`}
        aria-label="Notifications"
      >
        <Bell
          className={`w-5 h-5 transition-colors ${
            hasMaintenance ? "text-rose-400" : "text-text-secondary"
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-lg animate-pulse-glow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div
          id="notification-panel"
          className="absolute right-0 top-full mt-3 w-96 max-h-[480px] flex flex-col
            glass-strong rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-primary" />
              <span className="font-semibold text-text-primary text-sm">
                Notifikasi
              </span>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-md bg-accent-primary/20 text-accent-primary font-medium">
                  {notifications.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-white/5">
            <button
              onClick={() => setActiveTab("system")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "system" ? "border-accent-primary text-accent-primary bg-accent-primary/5" : "border-transparent text-text-muted hover:text-white"
              }`}
            >
              System
            </button>
            <button
              onClick={() => setActiveTab("social")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "social" ? "border-accent-primary text-accent-primary bg-accent-primary/5" : "border-transparent text-text-muted hover:text-white"
              }`}
            >
              Public
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
                <Bell className="w-10 h-10 opacity-30" />
                <p className="text-sm">Tidak ada notifikasi aktif</p>
              </div>
            ) : (
              <div className="p-3 flex flex-col gap-2">
                {filteredNotifications.map((notif) => {
                  const colors = getNotificationColor(notif.status);
                  const isUnread = !readIds.has(notif.id);
                  return (
                    <div
                      key={notif.id}
                      className="relative p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {isUnread && (
                        <span
                          className="absolute top-3 right-3 w-2 h-2 rounded-full"
                          style={{ background: colors.dot }}
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 p-1.5 rounded-lg flex-shrink-0"
                          style={{ background: `${colors.text}20` }}
                        >
                          <StatusIcon status={notif.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors.badge}`}
                            >
                              {colors.label}
                            </span>
                          </div>
                          <p
                            className="text-sm font-semibold mb-0.5"
                            style={{ color: colors.text }}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-xs text-text-muted mt-2">
                            {new Date(notif.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
