"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-accent-primary/5 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-accent-secondary/5 blur-3xl animate-float-delay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-cyan/3 blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo Brand Mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 glass rounded-3xl p-4 shadow-2xl">
            <Image 
              src="/logo.png" 
              alt="AIRAX AI Brand" 
              fill
              className="object-contain p-4"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs sm:text-sm font-medium text-accent-cyan mb-6 sm:mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>Platform AI Generasi Terbaru</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-[family-name:var(--font-display)] leading-[1.1] tracking-tight mb-6"
        >
          Ciptakan{" "}
          <span className="gradient-text">Influencer AI</span>
          <br className="hidden sm:block" />{" "}
          yang Tak Terbedakan dari{" "}
          <br className="hidden lg:block" />
          <span className="gradient-text-accent">Manusia Nyata</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
        >
          AIRAX AI mengubah cara Anda membuat konten digital. Hasilkan foto &amp; video 
          influencer ultra-realistis dalam hitungan detik, tanpa model, tanpa studio.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#gallery" className="btn-primary flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center">
            Mulai Sekarang
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#gallery" className="btn-secondary flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center">
            <Play className="w-4 h-4" />
            Lihat Demo
          </a>
        </motion.div>

        {/* Stats mini preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto"
        >
          {[
            { value: "10K+", label: "Pengguna Aktif" },
            { value: "500K+", label: "Konten Dibuat" },
            { value: "99%", label: "Kepuasan" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs sm:text-sm text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
    </section>
  );
}
