import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofStats from "@/components/SocialProofStats";
import AIShowcase from "@/components/AIShowcase";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

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
          price: "6588",
          priceCurrency: "TRY",
          billingDuration: "P1Y",
          description:
            "Sınırsız ürün & kategori, sınırsız masa, 34 dil desteği, QR kod oluşturma, alerjen & besin bilgisi, işletme künyesi, tema seçimi. 1 kullanıcı.",
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "17508",
          priceCurrency: "TRY",
          billingDuration: "P1Y",
          description:
            "Basic'teki her şey + AI destekli açıklamalar, otomatik çeviri (34 dil), garson çağırma, WhatsApp sipariş, happy hour & zamanlı menü, tükendi güncelleme, geri bildirim formu, indirim kodları, analitik dashboard. 5 kullanıcı.",
        },
        {
          "@type": "Offer",
          name: "Enterprise Plan",
          priceCurrency: "TRY",
          description:
            "Premium'daki her şey + çoklu şube yönetimi, POS entegrasyonu, online sipariş & ödeme, tablet menü, 7/24 VIP destek, sınırsız kullanıcı.",
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
        "Online Sipariş",
        "Analitik Dashboard",
        "Tükendi Güncelleme",
      ],
    },
  ],
};

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Tabbled | Restoranlar İçin AI Destekli Dijital Menü</title>
        <meta
          name="description"
          content="QR menü, 34 dilde otomatik çeviri, AI menü açıklaması, garson çağırma. 14 gün ücretsiz deneyin. 1 Ocak 2026 QR menü zorunluluğuna uyumlu. Türkiye'nin en akıllı dijital menü platformu."
        />
        <meta
          name="keywords"
          content="dijital menü, QR menü, restoran menü, kafe menü, otel menü, QR kod, AI menü, dijital menü zorunluluğu, Türkiye"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tabbled | Restoranlar İçin AI Destekli Dijital Menü" />
        <meta
          property="og:description"
          content="QR menü, 34 dilde otomatik çeviri, AI menü açıklaması, garson çağırma. 14 gün ücretsiz deneyin. 1 Ocak 2026 QR menü zorunluluğuna uyumlu."
        />
        <meta property="og:image" content="https://tabbled.com/og-image.png" />
        <meta property="og:url" content="https://tabbled.com" />
        <meta property="og:site_name" content="Tabbled" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tabbled | Restoranlar İçin AI Destekli Dijital Menü" />
        <meta
          name="twitter:description"
          content="QR menü, 34 dilde otomatik çeviri, AI menü açıklaması, garson çağırma. 14 gün ücretsiz deneyin."
        />
        <meta name="twitter:image" content="https://tabbled.com/og-image.png" />
        <link rel="canonical" href="https://tabbled.com" />
        <script type="application/ld+json">
          {JSON.stringify(landingSchema)}
        </script>
      </Helmet>
      <Navbar />
      <HeroSection />
      <SocialProofStats />
      <AIShowcase />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
      <CTABanner />
      <Footer />
    </div>
  );
};

export default Index;
