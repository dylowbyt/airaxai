"use client";

import Link from "next/link";
import { Search, User } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import TokenBalance from "@/components/dashboard/TokenBalance";

interface DashboardHeaderProps {
  title?: string;
  userEmail?: string;
  userAvatar?: string | null;
}

export default function DashboardHeader({
  title,
  userEmail,
  userAvatar,
}: DashboardHeaderProps) {
  return (
    <header
      id="dashboard-header"
      className="flex items-center justify-between px-6 py-4 glass border-b border-white/10 sticky top-0 z-40"
    >
      {/* Page Title */}
      <div>
        {title && (
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        )}
      </div>

      {/* Right side: Search, Tokens, Bell, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            id="dashboard-search"
            type="text"
            placeholder="Cari konten..."
            className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl
              text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/50
              focus:bg-white/8 transition-all duration-200 w-52"
          />
        </div>

        {/* Token Balance */}
        <TokenBalance />

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Avatar */}
        <Link
          href="/dashboard/settings"
          id="header-user-avatar"
          className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 hover:border-accent-primary/50
            transition-all duration-200 flex-shrink-0"
        >
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userEmail ?? "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
