import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const plans = [
  {
    name: "Başlangıç",
    price: "₺299",
    subtitle: "Dijital menü görüntüleme",
    features: ["QR menü (sınırsız ürün)", "4 dil desteği", "Alerjen bilgileri", "Temel admin panel", "E-posta destek"],
    popular: false,
    buttonVariant: "cream" as const,
  },
  {
    name: "Profesyonel",
    price: "₺499",
    subtitle: "Sipariş + garson çağır",
    features: ["Başlangıç'taki her şey", "Masadan sipariş verme", "Garson çağır butonu", "Sipariş durumu takibi", "Zaman bazlı menü", "Analytics dashboard", "Öncelikli destek"],
    popular: true,
    buttonVariant: "sage" as const,
  },
  {
    name: "Kurumsal",
    price: "₺799",
    subtitle: "Full suite + white-label",
    features: ["Profesyonel'deki her şey", "White-label (kendi logonuz)", "Upsell / cross-sell", "API erişimi", "Multi-property yönetim", "Dedicated account manager"],
    popular: false,
    buttonVariant: "cream" as const,
  },
];

const PricingSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="fiyatlar" className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Her bütçeye uygun planlar</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

              <div className="mb-6">
                <span className="text-4xl font-extrabold">{p.price}</span>
                <span className={`text-sm ${p.popular ? "text-card/70" : "text-muted-foreground"}`}>/ay</span>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.popular ? "text-card" : "text-sage"}`} />
                    <span className={p.popular ? "" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={p.buttonVariant}
                className={`w-full rounded-xl ${p.popular ? "bg-card text-grapefruit hover:bg-card/90 font-semibold" : ""}`}
                size="lg"
              >
                Hemen Başla
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
