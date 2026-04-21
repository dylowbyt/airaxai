// Notification types and utilities for the real-time notification system

export type NotificationStatus = "maintenance" | "promo" | "general" | "like" | "save" | "social";

export interface Notification {
  id: string;
  title: string;
  message: string;
  status: NotificationStatus;
  category: "system" | "social";
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
}

export function getNotificationColor(status: NotificationStatus) {
  switch (status) {
    case "maintenance":
      return {
        bg: "rgba(244, 63, 94, 0.15)",
        border: "rgba(244, 63, 94, 0.4)",
        text: "#f43f5e",
        dot: "#f43f5e",
        badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        label: "Maintenance",
      };
    case "promo":
      return {
        bg: "rgba(16, 185, 129, 0.15)",
        border: "rgba(16, 185, 129, 0.4)",
        text: "#10b981",
        dot: "#f59e0b",
        badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        label: "Promo",
      };
    case "like":
      return {
        bg: "rgba(244, 63, 94, 0.15)",
        border: "rgba(244, 63, 94, 0.4)",
        text: "#f43f5e",
        dot: "#f43f5e",
        badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        label: "Like",
      };
    case "save":
      return {
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.4)",
        text: "#f59e0b",
        dot: "#f59e0b",
        badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        label: "Simpan",
      };
    case "social":
      return {
        bg: "rgba(6, 182, 212, 0.15)",
        border: "rgba(6, 182, 212, 0.4)",
        text: "#06b6d4",
        dot: "#06b6d4",
        badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        label: "Social",
      };
    case "general":
    default:
      return {
        bg: "rgba(99, 102, 241, 0.15)",
        border: "rgba(99, 102, 241, 0.4)",
        text: "#6366f1",
        dot: "#6366f1",
        badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
        label: "Info",
      };
  }
}
