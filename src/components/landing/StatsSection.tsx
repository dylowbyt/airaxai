"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Users, Crown, TrendingUp, Activity } from "lucide-react";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString("id-ID")}</span>;
}

const stats = [
  {
    icon: Users,
    label: "Total Pengguna",
    value: 12847,
    suffix: "",
    color: "text-accent-primary",
    bgColor: "bg-accent-primary/10",
    borderColor: "border-accent-primary/20",
    glowColor: "shadow-accent-primary/10",
  },
  {
    icon: Crown,
    label: "Pengguna Berlangganan",
    value: 3291,
    suffix: "",
    color: "text-accent-secondary",
    bgColor: "bg-accent-secondary/10",
    borderColor: "border-accent-secondary/20",
    glowColor: "shadow-accent-secondary/10",
  },
  {
    icon: TrendingUp,
    label: "Konten Dibuat",
    value: 589420,
    suffix: "+",
    color: "text-accent-cyan",
    bgColor: "bg-accent-cyan/10",
    borderColor: "border-accent-cyan/20",
    glowColor: "shadow-accent-cyan/10",
  },
  {
    icon: Activity,
    label: "Uptime Server",
    value: 99,
    suffix: ".9%",
    color: "text-accent-emerald",
    bgColor: "bg-accent-emerald/10",
    borderColor: "border-accent-emerald/20",
    glowColor: "shadow-accent-emerald/10",
  },
];

export default function StatsSection() {
  return (
    <section id="statistik" className="relative py-20 sm:py-28 lg:py-32 bg-bg-primary">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent-primary/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-accent-emerald bg-accent-emerald/10 border border-accent-emerald/20 mb-4">Live Dashboard</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] mb-4">Statistik <span className="gradient-text">Real-Time</span></h2>
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">Data langsung dari platform kami. Bergabunglah dengan komunitas kreator AI yang terus berkembang.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`stat-card rounded-2xl p-5 sm:p-6 lg:p-8 text-center hover:shadow-lg ${stat.glowColor}`}
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] ${stat.color} mb-2`}>
                <AnimatedCounter target={stat.value} />
                {stat.suffix}
              </p>
              <p className="text-sm text-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Live indicator */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-2 mt-8 text-sm text-text-muted">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald/75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald"></span>
          </span>
          Data diperbarui secara real-time
        </motion.div>
      </div>
    </section>
  );
}
