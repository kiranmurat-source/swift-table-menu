import { Helmet } from "react-helmet-async";
import { LandingNavbar } from "@/components/landing/Navbar1";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhyNowSection } from "@/components/landing/WhyNowSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import CookieBanner from "@/components/CookieBanner";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

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

export default function Index() {
  return (
    <>
      <Helmet>
        <title>Tabbled — Restoran Dijital Menü Platformu</title>
        <meta
          name="description"
          content="QR menüden fazlası: restoranınız için tek dijital merkez. Menü yönetimi, AI araçları, garson çağırma, çok dilli destek."
        />
        <meta
          name="keywords"
          content="dijital menü, QR menü, restoran menü, kafe menü, otel menü, QR kod, Türkiye, fiyat etiketi yönetmeliği"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tabbled — Restoran Dijital Menü Platformu" />
        <meta
          property="og:description"
          content="QR menüden fazlası: restoranınız için tek dijital merkez. Menü yönetimi, AI araçları, garson çağırma, çok dilli destek."
        />
        <meta property="og:image" content="https://tabbled.com/og-image.png" />
        <meta property="og:url" content="https://tabbled.com" />
        <meta property="og:site_name" content="Tabbled" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tabbled — Restoran Dijital Menü Platformu" />
        <meta
          name="twitter:description"
          content="QR menüden fazlası: restoranınız için tek dijital merkez. Menü yönetimi, AI araçları, garson çağırma, çok dilli destek."
        />
        <meta name="twitter:image" content="https://tabbled.com/og-image.png" />
        <link rel="canonical" href="https://tabbled.com" />
        <script type="application/ld+json">
          {JSON.stringify(landingSchema)}
        </script>
      </Helmet>
      <LandingNavbar />
      <HeroSection />
      <WhyNowSection />
      <HowItWorksSection />
      <PricingSection />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
      <CookieBanner />
      <FloatingWhatsApp />
    </>
  );
}
