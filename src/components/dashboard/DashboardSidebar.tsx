"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clapperboard,
  Film,
  Clock,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
  MessageSquare,
  LayoutGrid,
  Coins,
  Cpu,
  Network,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: "/canvas",
    label: "Infinity Canvas",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    href: "/shorts",
    label: "Shorts Creator",
    icon: <Clapperboard className="w-5 h-5" />,
  },
  {
    href: "/reels",
    label: "Reels Gallery",
    icon: <Film className="w-5 h-5" />,
  },
  {
    href: "/chat",
    label: "AI Chatbot",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    href: "/history",
    label: "Riwayat",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    href: "/topup",
    label: "Top Up Token",
    icon: <Coins className="w-5 h-5" />,
  },
  {
    href: "/subscription",
    label: "Langganan",
    icon: <Crown className="w-5 h-5" />,
  },
  {
    href: "/dashboard/settings",
    label: "Pengaturan",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    href: "/admin",
    label: "Admin Panel",
    icon: <Settings className="w-5 h-5" />,
    adminOnly: true,
  },
];

interface DashboardSidebarProps {
  userRole?: string;
}

export default function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <aside
      id="dashboard-sidebar"
      className={`relative flex flex-col h-screen glass-strong border-r border-white/10 transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? "w-[72px]" : "w-64"}`}
    >
      {/* Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-8 z-10 w-7 h-7 rounded-full glass-strong border border-white/20
          flex items-center justify-center cursor-pointer hover:bg-accent-primary/20 transition-all duration-300 shadow-lg"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-text-secondary" />
        )}
      </button>

      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-6 border-b border-white/10 ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-cyan flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300">
             <Cpu className="w-6 h-6 text-white" />
          </div>
          {/* Animated rings around icon */}
          <div className="absolute inset-0 rounded-xl border border-accent-primary/50 animate-ping opacity-20" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-bold font-[family-name:var(--font-display)] tracking-tighter leading-none">
              <span className="gradient-text">AIRAX</span>{" "}
              <span className="text-text-primary">AI</span>
            </span>
            <span className="text-[9px] text-accent-cyan/70 font-bold tracking-[0.2em] uppercase mt-1.5 leading-none">
              Next-Gen Platform
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isAdmin = item.adminOnly;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`sidebar-nav-${item.href.replace("/", "")}`}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${collapsed ? "justify-center" : ""}
                ${
                  isActive
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                    : isAdmin
                    ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/8"
                }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent-primary" />
              )}

              <span
                className={`flex-shrink-0 ${
                  isActive ? "text-accent-primary" : ""
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}

              {/* Admin badge */}
              {!collapsed && isAdmin && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                  ADMIN
                </span>
              )}

              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-bg-card border border-white/15 text-xs text-text-primary whitespace-nowrap
                  opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary
            hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer group
            ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-bg-card border border-white/15 text-xs text-text-primary whitespace-nowrap
              opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
