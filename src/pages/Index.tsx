import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";

const landingSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://tabbled.com/#organization",
      name: "Tabbled",
      legalName: "KHP Limited",
      url: "https://tabbled.com",
      logo: "https://tabbled.com/og-image.png",
      description:
        "Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü desteği, garson çağırma, WhatsApp sipariş, geri bildirim toplama ve indirim kodu yönetimi gibi özellikler sunar. KHP Limited tarafından işletilmektedir.",
      foundingDate: "2025",
      areaServed: { "@type": "Country", name: "Turkey" },
      serviceType: ["QR Menü", "Dijital Menü", "Restoran Teknolojisi"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "info@tabbled.com",
        contactType: "customer service",
        availableLanguage: ["Turkish", "English"],
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://tabbled.com/#software",
      name: "Tabbled",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformu. Çok dilli menü, garson çağırma, WhatsApp sipariş, geri bildirim ve indirim kodu özellikleri sunar.",
      url: "https://tabbled.com",
      provider: { "@id": "https://tabbled.com/#organization" },
      offers: [
        {
          "@type": "Offer",
          name: "Basic Plan",
          price: "3600",
          priceCurrency: "TRY",
          billingDuration: "P1Y",
          description:
            "QR menü, alerjen bilgisi, QR kod özelleştirme, işletme künyesi. 1 kullanıcı, 1 şube.",
        },
        {
          "@type": "Offer",
          name: "Pro Plan",
          price: "7200",
          priceCurrency: "TRY",
          billingDuration: "P1Y",
          description:
            "Basic özellikleri + çok dilli menü (2 dil), happy hour, garson çağırma, WhatsApp sipariş, AI menü açıklaması, geri bildirim, indirim kodları. 3 kullanıcı, 1 şube.",
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "14400",
          priceCurrency: "TRY",
          billingDuration: "P1Y",
          description:
            "Tüm özellikler: 40 özellik, 4 dil, online sipariş, masa rezervasyonu, sadakat programı, analitik, çoklu şube. 5 kullanıcı, 5 şube.",
        },
      ],
      featureList: [
        "QR Kod ile Dijital Menü",
        "Çok Dilli Menü (34 dil desteği)",
        "Garson Çağırma",
        "WhatsApp Sipariş",
        "Geri Bildirim ve Google Reviews Yönlendirme",
        "İndirim Kodları",
        "Happy Hour / Zamanlı Fiyat",
        "Besin Değerleri ve Alerjen Bilgisi",
        "AI Menü Açıklaması Yazıcı",
        "Sepet Sistemi",
        "3 Tema (Beyaz/Siyah/Kırmızı)",
        "Promosyon Yönetimi",
        "QR Kod Özelleştirme (Logo, Renk)",
      ],
    },
  ],
};
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
          content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar."
        />
        <meta
          name="keywords"
          content="dijital menü, QR menü, restoran menü, kafe menü, otel menü, QR kod, Türkiye, fiyat etiketi yönetmeliği"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
        <meta
          property="og:description"
          content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar."
        />
        <meta property="og:image" content="https://tabbled.com/og-image.png" />
        <meta property="og:url" content="https://tabbled.com" />
        <meta property="og:site_name" content="Tabbled" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tabbled — Dijital Menü ve QR Kod Platformu" />
        <meta
          name="twitter:description"
          content="Tabbled, Türkiye'deki restoran, kafe ve oteller için QR kod tabanlı dijital menü yönetim platformudur. Çok dilli menü, garson çağırma, WhatsApp sipariş ve müşteri yönetimi çözümleri sunar."
        />
        <meta name="twitter:image" content="https://tabbled.com/og-image.png" />
        <link rel="canonical" href="https://tabbled.com" />
        <script type="application/ld+json">
          {JSON.stringify(landingSchema)}
        </script>
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
