import { Button } from "@/components/ui/button";
import { CiCircleCheck, CiCircleRemove } from "react-icons/ci";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const plans = [
  {
    name: "Basic",
    priceMonthly: "₺300",
    priceYearly: "₺3.600",
    subtitle: "Dijital menü başlangıcı",
    features: [
      { text: "QR Menü", included: true },
      { text: "Alerjen / kalori bilgisi", included: true },
      { text: "QR kod özelleştirme", included: true },
      { text: "İşletme künyesi", included: true },
      { text: "1 kullanıcı, 1 şube", included: true },
      { text: "Çok dilli menü", included: false },
      { text: "Garson çağırma", included: false },
      { text: "Online sipariş", included: false },
    ],
    featureCount: 4,
    popular: false,
    buttonVariant: "cream" as const,
  },
  {
    name: "Pro",
    priceMonthly: "₺600",
    priceYearly: "₺7.200",
    subtitle: "Sipariş, pazarlama ve AI",
    features: [
      { text: "Basic'teki her şey", included: true },
      { text: "Çok dilli menü (2 dil)", included: true },
      { text: "Happy hour / zamanlı fiyat", included: true },
      { text: "Tablet menü (3 tablet)", included: true },
      { text: "AI menü açıklaması yazıcı", included: true },
      { text: "Garson çağırma", included: true },
      { text: "WhatsApp sipariş", included: true },
      { text: "Lokal SEO + Google Reviews", included: true },
      { text: "3 kullanıcı, 1 şube", included: true },
    ],
    featureCount: 16,
    popular: true,
    buttonVariant: "sage" as const,
  },
  {
    name: "Premium",
    priceMonthly: "₺1.200",
    priceYearly: "₺14.400",
    subtitle: "Full suite — tüm özellikler",
    features: [
      { text: "Pro'daki her şey", included: true },
      { text: "Çok dilli menü (4 dil)", included: true },
      { text: "Online sipariş + teslimat", included: true },
      { text: "Masadan ödeme (QR)", included: true },
      { text: "Sadakat programı", included: true },
      { text: "SMS / WhatsApp marketing", included: true },
      { text: "Analitik / raporlama", included: true },
      { text: "Çoklu şube yönetimi", included: true },
      { text: "5 kullanıcı, 5 şube", included: true },
      { text: "Öncelikli destek", included: true },
    ],
    featureCount: 39,
    popular: false,
    buttonVariant: "cream" as const,
  },
];

const PricingSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="fiyatlar" className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Her bütçeye uygun planlar</h2>
          <p className="text-muted-foreground">Sadece yıllık abonelik. Kurulum ücreti yok.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-200 hover:scale-[1.01] ${
                p.popular
                  ? "bg-grapefruit text-card shadow-xl scale-[1.02]"
                  : "bg-card border border-border"
              }`}
            >
              {p.popular && (
                <span className="absolute top-4 right-4 bg-gold/30 text-card text-xs font-bold px-3 py-1 rounded-full">
                  Popüler
                </span>
              )}

              <h3 className={`text-xl font-bold mb-1 ${p.popular ? "" : "text-foreground"}`}>{p.name}</h3>
              <p className={`text-sm mb-4 ${p.popular ? "text-card/80" : "text-muted-foreground"}`}>{p.subtitle}</p>

              <div className="mb-1">
                <span className="text-4xl font-extrabold">{p.priceMonthly}</span>
                <span className={`text-sm ${p.popular ? "text-card/70" : "text-muted-foreground"}`}>/ay</span>
              </div>
              <p className={`text-xs mb-6 ${p.popular ? "text-card/60" : "text-muted-foreground"}`}>
                {p.priceYearly}/yıl
              </p>

              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <CiCircleCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.popular ? "text-card" : "text-sage"}`} />
                    ) : (
                      <CiCircleRemove className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.popular ? "text-card/40" : "text-muted-foreground/40"}`} />
                    )}
                    <span className={`${!f.included ? (p.popular ? "text-card/50" : "text-muted-foreground/50") : (p.popular ? "" : "text-foreground")}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <p className={`text-xs mb-4 text-center ${p.popular ? "text-card/60" : "text-muted-foreground"}`}>
                Toplam {p.featureCount} özellik
              </p>

              <Button
                variant={p.buttonVariant}
                className={`w-full rounded-xl ${p.popular ? "bg-card text-grapefruit hover:bg-card/90 font-semibold" : ""}`}
                size="lg"
                onClick={() => window.open("https://wa.me/905325119484?text=Merhaba, Tabbled " + p.name + " planı hakkında bilgi almak istiyorum.", "_blank")}
              >
                Bilgi Al
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
