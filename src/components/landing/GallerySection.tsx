"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { Play, Heart, Eye, X } from "lucide-react";

const galleryItems = [
  { id: 1, src: "/gallery/influencer-1.png", alt: "AI Influencer - Rooftop Sunset", type: "photo", category: "Lifestyle", likes: "12.5K", views: "89K", height: "h-72 sm:h-80" },
  { id: 2, src: "/gallery/influencer-2.png", alt: "AI Influencer - Urban Streetwear", type: "video", category: "Fashion", likes: "8.3K", views: "56K", height: "h-56 sm:h-64" },
  { id: 3, src: "/gallery/influencer-3.png", alt: "AI Influencer - Cafe Lifestyle", type: "photo", category: "Lifestyle", likes: "15.1K", views: "102K", height: "h-64 sm:h-72" },
  { id: 4, src: "/gallery/influencer-4.png", alt: "AI Influencer - Fitness", type: "video", category: "Fitness", likes: "9.7K", views: "67K", height: "h-80 sm:h-96" },
  { id: 5, src: "/gallery/influencer-5.png", alt: "AI Influencer - Travel", type: "photo", category: "Travel", likes: "18.2K", views: "134K", height: "h-56 sm:h-64" },
  { id: 6, src: "/gallery/influencer-6.png", alt: "AI Influencer - Beauty Portrait", type: "photo", category: "Beauty", likes: "22.8K", views: "178K", height: "h-72 sm:h-80" },
];

export default function GallerySection() {
  const [selected, setSelected] = useState<typeof galleryItems[0] | null>(null);

  return (
    <section id="gallery" className="relative py-20 sm:py-28 lg:py-32 bg-bg-secondary">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-secondary/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase text-accent-secondary bg-accent-secondary/10 border border-accent-secondary/20 mb-4">Showcase</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[family-name:var(--font-display)] mb-4">Hasil <span className="gradient-text">AI Kami</span></h2>
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl mx-auto">Setiap foto dan video di bawah ini 100% dihasilkan oleh AI. Tidak ada model manusia, tidak ada sesi foto.</p>
        </motion.div>

        <div className="masonry-grid">
          {galleryItems.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ duration: 0.5, delay: index * 0.08 }} className="masonry-item">
              <div className={`group relative ${item.height} rounded-2xl overflow-hidden cursor-pointer border border-border-default hover:border-border-hover transition-all duration-300`} onClick={() => setSelected(item)}>
                <Image src={item.src} alt={item.alt} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {item.type === "video" && <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></div>}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white border border-white/10">{item.category}</div>
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-4 text-white/90 text-xs">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{item.likes}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{item.views}</span>
                  </div>
                  <p className="text-white text-sm font-medium mt-1.5">{item.alt}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelected(null)}>
          <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer z-10"><X className="w-5 h-5 text-white" /></button>
          <div className="relative w-full max-w-3xl aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Image src={selected.src} alt={selected.alt} fill className="object-cover" sizes="90vw" priority />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-white text-lg font-semibold">{selected.alt}</h3>
              <div className="flex items-center gap-4 text-white/70 text-sm mt-2">
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{selected.likes}</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{selected.views}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
