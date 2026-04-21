import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import VisionMissionSection from "@/components/landing/VisionMissionSection";
import GallerySection from "@/components/landing/GallerySection";
import StatsSection from "@/components/landing/StatsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <VisionMissionSection />
        <GallerySection />
        <StatsSection />
      </main>
      <Footer />
    </>
  );
}
