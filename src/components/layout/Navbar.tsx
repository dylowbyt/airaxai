"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import LoginButton from "@/components/auth/LoginButton";
import UserMenu from "@/components/auth/UserMenu";
import Image from "next/image";
import { Zap } from "lucide-react";

const navLinks = [
  { href: "#visi-misi", label: "Visi & Misi" },
  { href: "#gallery", label: "Gallery" },
  { href: "#statistik", label: "Statistik" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  return (
    <>
      <nav
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "glass-strong shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group" id="logo-link">
              <div className="relative w-12 h-12 overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="AIRAX AI Logo" 
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold font-[family-name:var(--font-display)] tracking-tight">
                <span className="gradient-text">AIRAX</span>{" "}
                <span className="text-text-primary">AI</span>
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary
                    rounded-lg hover:bg-white/5 transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth + Hamburger */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                {user ? <UserMenu user={user} /> : <LoginButton />}
              </div>

              {/* Hamburger Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${isMenuOpen ? "hamburger-active" : ""}`}
                aria-label="Toggle menu"
                id="hamburger-button"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`mobile-menu-panel ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 pt-20">
          {/* Mobile Auth */}
          <div className="mb-8 pb-6 border-b border-white/10">
            {user ? <UserMenu user={user} /> : <LoginButton />}
          </div>

          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-text-secondary hover:text-text-primary
                  rounded-xl hover:bg-white/5 transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
