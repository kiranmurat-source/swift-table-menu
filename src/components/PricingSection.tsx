import { Check, X } from "@phosphor-icons/react";
import { useRef, useState, useEffect } from "react";

const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
};

interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  priceLabel: string;
  features: Feature[];
  popular: boolean;
  ctaText: string;
  ctaHref: string;
}

const plans: Plan[] = [
  {
    name: "Basic",
    price: "549 ₺",
    priceLabel: "/ay",
    features: [
      { text: "Sınırsız Ürün & Kategori", included: true },
      { text: "Sınırsız Masa", included: true },
      { text: "34 Dil Desteği", included: true },
      { text: "QR Kod Oluşturma", included: true },
      { text: "Alerjen & Besin Bilgisi", included: true },
      { text: "İşletme Künyesi", included: true },
      { text: "Tema Seçimi", included: true },
      { text: "1 Kullanıcı", included: true },
      { text: "AI Açıklamalar", included: false },
      { text: "Garson Çağırma", included: false },
    ],
    popular: false,
    ctaText: "14 Gün Ücretsiz Deneyin",
    ctaHref: "/login",
  },
  {
    name: "Premium",
    price: "1.459 ₺",
    priceLabel: "/ay",
    features: [
      { text: "Basic'teki her şey", included: true },
      { text: "AI Destekli Açıklamalar", included: true },
      { text: "Otomatik Çeviri (34 Dil)", included: true },
      { text: "Garson Çağırma", included: true },
      { text: "WhatsApp Sipariş", included: true },
      { text: "Happy Hour & Zamanlı Menü", included: true },
      { text: "Tükendi Güncelleme", included: true },
      { text: "Geri Bildirim Formu", included: true },
      { text: "İndirim Kodları", included: true },
      { text: "Analitik Dashboard", included: true },
      { text: "5 Kullanıcı", included: true },
    ],
    popular: true,
    ctaText: "14 Gün Ücretsiz Deneyin",
    ctaHref: "/login",
  },
  {
    name: "Enterprise",
    price: "Özel Fiyat",
    priceLabel: "",
    features: [
      { text: "Premium'daki her şey", included: true },
      { text: "Çoklu Şube Yönetimi", included: true },
      { text: "POS Entegrasyonu", included: true },
      { text: "Online Sipariş & Ödeme", included: true },
      { text: "Tablet Menü", included: true },
      { text: "7/24 VIP Destek", included: true },
      { text: "Sınırsız Kullanıcı", included: true },
    ],
    popular: false,
    ctaText: "Satışla Görüşün",
    ctaHref: "/login",
  },
];

const PricingSection = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      id="fiyatlandirma"
      className={`py-20 lg:py-28 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#FFF0F3] text-[#FF4F7A] px-4 py-1 rounded-full text-sm font-bold mb-4">
            %25 Lansman İndirimi
          </div>
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#1C1C1E]">
            İşletmenize Uygun Paketi Seçin
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-10 ${
                p.popular
                  ? "bg-[#1C1C1E] text-white scale-105 shadow-2xl"
                  : "bg-white border border-gray-100"
              }`}
              style={!p.popular ? { boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" } : undefined}
            >
              {p.popular && (
                <span className="absolute -top-4 right-8 bg-[#FF4F7A] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  EN POPÜLER
                </span>
              )}

              <h3 className={`text-xl font-bold mb-4 ${p.popular ? "text-white" : "text-[#1C1C1E]"}`}>
                {p.name}
              </h3>

              <div className="mb-6">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.priceLabel && (
                  <span className={`text-sm ${p.popular ? "text-white/60" : "text-[#9CA3AF]"}`}>
                    {p.priceLabel}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    {f.included ? (
                      <Check
                        size={16}
                        weight="bold"
                        className={`mt-0.5 flex-shrink-0 ${p.popular ? "text-[#FF4F7A]" : "text-[#FF4F7A]"}`}
                      />
                    ) : (
                      <X
                        size={16}
                        weight="bold"
                        className={`mt-0.5 flex-shrink-0 ${p.popular ? "text-white/30" : "text-[#E5E7EB]"}`}
                      />
                    )}
                    <span
                      className={
                        f.included
                          ? p.popular ? "text-white/90" : "text-[#1C1C1E]"
                          : p.popular ? "text-white/30" : "text-[#9CA3AF]"
                      }
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={p.ctaHref}
                className={`block w-full text-center font-bold py-3.5 rounded-lg transition-all duration-200 ${
                  p.popular
                    ? "text-[#FF4F7A] bg-white hover:bg-white/90"
                    : "border border-[#E5E7EB] text-[#1C1C1E] hover:border-[#FF4F7A] hover:text-[#FF4F7A]"
                }`}
                style={
                  p.popular
                    ? { background: "white" }
                    : undefined
                }
              >
                {p.ctaText}
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#9CA3AF] text-center mt-8">
          Kredi kartı gerekmez · 14 gün ücretsiz deneme · Tüm fiyatlar KDV hariçtir · Yalnızca yıllık ödeme
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
