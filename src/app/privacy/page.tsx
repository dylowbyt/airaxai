import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AIRAX AI",
  description: "Kebijakan Privasi AIRAX AI. Pelajari bagaimana kami melindungi data dan privasi Anda.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] mb-4">
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="text-text-muted text-sm mb-10">Terakhir diperbarui: April 2026</p>

          <div className="space-y-8 text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">1. Informasi yang Kami Kumpulkan</h2>
              <p>Kami mengumpulkan informasi yang Anda berikan secara langsung, termasuk nama, alamat email, dan data profil saat Anda mendaftar melalui Google Authentication. Kami juga mengumpulkan data penggunaan layanan secara otomatis untuk meningkatkan pengalaman Anda.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">2. Penggunaan Informasi</h2>
              <p>Informasi yang dikumpulkan digunakan untuk menyediakan dan memelihara layanan kami, memproses langganan, mengirim pembaruan layanan, dan meningkatkan platform AIRAX AI. Kami tidak menjual data pribadi Anda kepada pihak ketiga.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">3. Penyimpanan Data</h2>
              <p>Data Anda disimpan dengan aman menggunakan infrastruktur Supabase yang terenkripsi. Kami menerapkan langkah-langkah keamanan standar industri untuk melindungi informasi Anda dari akses yang tidak sah.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">4. Konten AI</h2>
              <p>Semua konten yang dihasilkan melalui platform kami adalah 100% sintetis. Kami tidak menggunakan data biometrik atau foto individu nyata tanpa persetujuan eksplisit. Konten yang Anda buat tetap menjadi milik Anda sesuai ketentuan langganan.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">5. Hak Pengguna</h2>
              <p>Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja. Untuk melakukan hal tersebut, silakan hubungi tim dukungan kami melalui email.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">6. Hubungi Kami</h2>
              <p>Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami di <a href="mailto:privacy@airaxai.com" className="text-accent-primary hover:underline">privacy@airaxai.com</a>.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
