import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Wifi, Battery, Signal } from "lucide-react";

const avatarColors = ["bg-grapefruit", "bg-sage", "bg-salmon", "bg-gold"];
const avatarLetters = ["A", "M", "S", "K"];

const HeroImage = () => (
  <div className="relative">
    <div className="absolute inset-0 bg-gradient-to-br from-grapefruit/20 via-sage/10 to-transparent rounded-3xl blur-3xl scale-110" />
    <div className="relative rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)]">
      <img
        src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80"
        alt="Restoran ortamında dijital menü kullanımı"
        className="w-full h-auto object-cover rounded-3xl"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent rounded-3xl" />
    </div>
  </div>
);

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
            <HeroImage />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
