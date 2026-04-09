import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LogoBar from "@/components/LogoBar";
import FeaturesSection from "@/components/FeaturesSection";
import ValueProposition from "@/components/ValueProposition";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import FeatureComparisonTable from "@/components/FeatureComparisonTable";
import RoadmapSection from "@/components/RoadmapSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import MetricsBar from "@/components/MetricsBar";
import CTABanner from "@/components/CTABanner";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tabbled — Dijital Menü ve QR Kod Platformu | Restoran, Kafe, Otel</title>
        <meta
          name="description"
          content="Tabbled ile restoranınız için QR menü oluşturun. Dijital menü, çok dilli destek, allerjen bilgisi, promosyon yönetimi. Türkiye'nin en uygun fiyatlı dijital menü platformu."
        />
        <meta
          name="keywords"
          content="dijital menü, QR menü, restoran menü, kafe menü, otel menü, QR kod, Türkiye, fiyat etiketi yönetmeliği"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
        <meta
          property="og:description"
          content="Restoranınız için profesyonel dijital menü. Aylık 300₺'den başlayan fiyatlarla."
        />
        <meta property="og:image" content="https://tabbled.com/tabbled-logo.png" />
        <meta property="og:url" content="https://tabbled.com" />
        <meta property="og:site_name" content="Tabbled" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
        <meta
          name="twitter:description"
          content="Restoranınız için profesyonel dijital menü. Aylık 300₺'den başlayan fiyatlarla."
        />
        <meta name="twitter:image" content="https://tabbled.com/tabbled-logo.png" />
        <link rel="canonical" href="https://tabbled.com" />
      </Helmet>
      <Navbar />
      <HeroSection />
      <LogoBar />
      <FeaturesSection />
      <ValueProposition />
      <HowItWorks />
      <PricingSection />
      <FeatureComparisonTable />
      <RoadmapSection />
      <TestimonialsSection />
      <MetricsBar />
      <CTABanner />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
