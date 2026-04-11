import { Button } from "@/components/ui/button";
import { CaretCircleRight, Play, Star } from "@phosphor-icons/react";
import heroImageWebp from "@/assets/hero-restaurant.webp";
import heroImageJpg from "@/assets/hero-restaurant.jpg";

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

            <div className="flex flex-wrap gap-4 mb-6">
              <a href="/iletisim">
                <Button variant="hero" size="lg" className="rounded-full px-8 text-base">
                  14 Gün Ücretsiz Deneyin <CaretCircleRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="/menu/demo">
                <Button variant="hero-outline" size="lg" className="rounded-full px-8 text-base">
                  <Play className="w-4 h-4" /> Demo Menüyü İncele
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground mb-10">
              ✓ Kredi kartı gerekmez &nbsp; ✓ 2 dakikada kurulum &nbsp; ✓ İstediğiniz zaman iptal
            </p>

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

          {/* Right: Hero Image */}
          <div className="flex justify-center lg:justify-end">
            <picture>
              <source srcSet={heroImageWebp} type="image/webp" />
              <img
                src={heroImageJpg}
                alt="Restoranda QR menü kullanan misafirler"
                width={1600}
                height={892}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full max-w-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] object-cover"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
