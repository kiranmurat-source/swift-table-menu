import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Star } from "lucide-react";

const avatarColors = ["bg-grapefruit", "bg-sage", "bg-salmon", "bg-gold"];
const avatarLetters = ["A", "M", "S", "K"];

const HeroSection = () => {
  return (
    <section className="pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage/15 mb-6">
              <span className="w-2 h-2 rounded-full bg-sage" />
              <span className="text-sm font-medium text-sage">Otel ve restoranlar için</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Menünüzü{" "}
              <span className="text-grapefruit">dijitalleştirin.</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              QR kodla tarayın, menüyü görüntüleyin, masadan sipariş verin. Garson çağırma, sipariş takibi ve çok dilli menü tek platformda.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button variant="hero" size="lg" className="rounded-full px-8 text-base">
                Ücretsiz Başla <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="hero-outline" size="lg" className="rounded-full px-8 text-base">
                <Play className="w-4 h-4" /> Nasıl Çalışır?
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {avatarColors.map((c, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full ${c} flex items-center justify-center text-sm font-bold text-card ring-2 ring-card`}
                  >
                    {avatarLetters[i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-medium">Otelcilerin tercihi</span>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-[280px] sm:w-[300px] rounded-[2.5rem] border-[6px] border-foreground/10 bg-card shadow-2xl overflow-hidden">
              {/* Phone status bar */}
              <div className="h-6 bg-foreground/5 flex items-center justify-center">
                <div className="w-16 h-1 rounded-full bg-foreground/20" />
              </div>
              {/* Header */}
              <div className="bg-grapefruit px-4 py-4">
                <p className="text-card text-xs font-medium opacity-80">Hoş geldiniz</p>
                <p className="text-card text-lg font-bold font-heading">Ramada Encore</p>
              </div>
              {/* Category pills */}
              <div className="px-4 py-3 flex gap-2 overflow-hidden">
                {["Kahvaltı", "Ana Yemek", "İçecek", "Tatlı"].map((cat, i) => (
                  <span
                    key={cat}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${
                      i === 0 ? "bg-grapefruit text-card" : "bg-cream text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
              {/* Menu items */}
              <div className="px-4 pb-2 space-y-3">
                {[
                  { name: "Serpme Kahvaltı", price: "₺280", tag: "Popüler" },
                  { name: "Menemen", price: "₺120", tag: null },
                  { name: "Eggs Benedict", price: "₺160", tag: null },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-cream/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        {item.tag && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/30 text-foreground">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.price}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center text-sage text-lg font-bold">+</div>
                  </div>
                ))}
              </div>
              {/* Bottom CTA */}
              <div className="px-4 py-3 border-t border-border">
                <div className="bg-grapefruit text-card text-center py-2.5 rounded-xl text-sm font-bold">
                  Garson Çağır
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
