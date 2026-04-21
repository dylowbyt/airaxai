import { Zap } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="main-footer" className="relative bg-bg-secondary border-t border-border-default">
      {/* Subtle glow effect at the top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-[family-name:var(--font-display)]">
                <span className="gradient-text">AIRAX</span>{" "}
                <span className="text-text-primary">AI</span>
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
              Platform AI terdepan untuk menghasilkan konten influencer yang realistis.
              Revolusi pembuatan konten digital dengan kecerdasan buatan generasi terbaru.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Navigasi
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#visi-misi" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Visi & Misi
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#statistik" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Statistik
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                  id="privacy-policy-link"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; 2026 AIRAX AI. Developed by <span className="text-accent-primary font-bold">ANDI PEBRIANTO</span> - FOUNDER & LEAD DEVELOPER
          </p>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <span>Powered by</span>
            <span className="gradient-text font-semibold">Artificial Intelligence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
