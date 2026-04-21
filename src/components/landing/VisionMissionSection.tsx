"use client";

import { motion } from "framer-motion";
import { Target, Eye, Lightbulb, Shield, Rocket, Users } from "lucide-react";

const values = [
  {
    icon: Eye,
    title: "Visi Kami",
    description:
      "Menjadi platform AI nomor satu di Indonesia yang merevolusi industri konten digital, memberdayakan setiap kreator untuk menghasilkan konten influencer berkualitas tinggi tanpa batasan.",
    gradient: "from-accent-primary to-accent-secondary",
  },
  {
    icon: Target,
    title: "Misi Kami",
    description:
      "Mengembangkan teknologi AI generatif yang menghasilkan konten ultra-realistis, membangun ekosistem kreator yang inklusif, dan menjadikan AI sebagai alat demokratisasi kreativitas.",
    gradient: "from-accent-cyan to-accent-emerald",
  },
];

const features = [
  {
    icon: Lightbulb,
    title: "Kreativitas Tanpa Batas",
    description: "Buat ribuan variasi konten unik hanya dengan satu klik. AI kami memahami estetika dan tren terkini.",
  },
  {
    icon: Shield,
    title: "Privasi Terjamin",
    description: "Tidak perlu data wajah asli. Setiap influencer AI dihasilkan 100% sintetis dengan teknologi proprietari.",
  },
  {
    icon: Rocket,
    title: "Kecepatan Produksi",
    description: "Dari konsep ke konten final dalam hitungan detik. Hemat waktu produksi hingga 95% dibanding metode tradisional.",
  },
  {
    icon: Users,
    title: "Skalabilitas Massal",
    description: "Jalankan kampanye multi-platform dengan puluhan persona influencer sekaligus, tanpa biaya model tambahan.",
  },
];

export default function VisionMissionSection() {
  return (
    <section id="visi-misi" className="relative py-20 sm:py-28 lg:py-32 bg-bg-primary">
      {/* Subtle background effects */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />
      <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-accent-primary/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-accent-secondary/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 mb-4">
            Tentang Kami
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] mb-4">
            Mengapa Memilih{" "}
            <span className="gradient-text">AIRAX AI</span>?
          </h2>
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">
            Kami percaya AI adalah masa depan kreativitas. Bergabunglah dengan ribuan kreator
            yang telah mengubah cara mereka berkarya.
          </p>
        </motion.div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 sm:mb-20">
          {values.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative rounded-2xl p-6 sm:p-8 glass glow-border overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-5 sm:p-6 rounded-2xl bg-bg-card border border-border-default
                hover:border-border-hover hover:bg-bg-card-hover transition-all duration-300
                hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-primary/5"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-accent-primary" />
              </div>
              <h4 className="text-base font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
