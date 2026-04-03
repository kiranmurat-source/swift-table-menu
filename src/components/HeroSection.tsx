import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Wifi, Battery, Signal } from "lucide-react";

const avatarColors = ["bg-grapefruit", "bg-sage", "bg-salmon", "bg-gold"];
const avatarLetters = ["A", "M", "S", "K"];

const PhoneMockup = () => (
  <div className="relative w-[220px] sm:w-[240px] rounded-[2.5rem] bg-foreground/90 p-[3px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3),0_0_40px_rgba(232,99,122,0.15)]">
    <div className="rounded-[2.3rem] bg-card overflow-hidden">
      {/* Notch */}
      <div className="relative h-7 bg-foreground/90 flex items-end justify-center pb-1">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-foreground/90 rounded-b-[16px] flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-grapefruit">
        <span className="text-card text-[9px] font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <Signal className="w-2.5 h-2.5 text-card" />
          <Wifi className="w-2.5 h-2.5 text-card" />
          <Battery className="w-3 h-3 text-card" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-grapefruit px-4 pb-3 pt-1.5">
        <p className="text-card/70 text-[9px] font-medium tracking-wide uppercase">Hoş geldiniz</p>
        <p className="text-card text-base font-extrabold font-heading mt-0.5">Ramada Encore</p>
        <p className="text-card/60 text-[9px] mt-0.5">Masa 12 · Lobby Restaurant</p>
      </div>

      {/* Category pills */}
      <div className="px-3 py-2 flex gap-1.5 overflow-hidden">
        {[
          { label: "Kahvaltı", active: true },
          { label: "Ana Yemek", active: false },
          { label: "İçecek", active: false },
        ].map((cat) => (
          <span
            key={cat.label}
            className={`text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
              cat.active ? "bg-grapefruit text-card shadow-sm" : "bg-cream text-muted-foreground"
            }`}
          >
            {cat.label}
          </span>
        ))}
      </div>

      {/* Menu items */}
      <div className="px-3 pb-2 space-y-2">
        {[
          { name: "Serpme Kahvaltı", price: "₺280", tag: "Popüler" },
          { name: "Menemen", price: "₺120", tag: null },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-2 p-2.5 rounded-xl bg-cream/50 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-salmon/30 to-gold/20 flex-shrink-0 flex items-center justify-center">
              <span className="text-sm">🍳</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-bold text-foreground truncate">{item.name}</p>
                {item.tag && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-gold/25 text-foreground flex-shrink-0">{item.tag}</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-grapefruit mt-0.5">{item.price}</p>
            </div>
            <button className="w-7 h-7 rounded-lg bg-sage/15 flex items-center justify-center text-sage text-sm font-bold flex-shrink-0">+</button>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="px-3 py-2 border-t border-border/60">
        <div className="flex gap-2">
          <div className="flex-1 bg-grapefruit text-card text-center py-2 rounded-xl text-[11px] font-bold">Garson Çağır</div>
          <div className="relative bg-sage text-sage-foreground text-center py-2 px-3 rounded-xl text-[11px] font-bold">
            Sepet
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-grapefruit text-card text-[9px] font-bold flex items-center justify-center">2</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-2 pt-1">
        <div className="w-24 h-1 rounded-full bg-foreground/15" />
      </div>
    </div>
  </div>
);

const HeroVisual = () => (
  <div className="relative flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-grapefruit/20 via-sage/10 to-transparent rounded-3xl blur-3xl scale-110" />
    {/* Background restaurant image */}
    <div className="relative rounded-3xl overflow-hidden shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] w-full max-w-md">
      <img
        src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80"
        alt="Restoran ortamında dijital menü kullanımı"
        className="w-full h-[420px] object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-foreground/10 to-transparent" />
    </div>
    {/* Phone mockup overlaid */}
    <div className="absolute -bottom-6 -right-4 sm:right-0 scale-75 sm:scale-90 origin-bottom-right">
      <PhoneMockup />
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
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
