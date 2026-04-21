"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="user-menu-button"
        className="flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white/5 hover:bg-white/10 border border-white/10
          transition-all duration-300 cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-7 h-7 rounded-full ring-2 ring-accent-primary/30"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium text-text-primary max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-2xl py-2 z-50">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-text-primary">{displayName}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          <a
            href="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary
              hover:bg-white/5 transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            Dashboard
          </a>
          <a
            href="/dashboard/settings"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary
              hover:bg-white/5 transition-colors cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            Pengaturan
          </a>
          <button
            onClick={handleLogout}
            id="logout-button"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-rose
              hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
