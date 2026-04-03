import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const items = [
  { title: "QR Menü & Sipariş", badge: "Aktif", badgeClass: "bg-sage/20 text-sage", desc: "Dijital menü, masadan sipariş, garson çağır", active: true },
  { title: "POS Entegrasyonu", badge: "Yakında", badgeClass: "bg-gold/25 text-foreground", desc: "Mevcut POS sisteminizle entegre çalışın", active: false },
  { title: "Tedarikçi Marketplace", badge: "Yakında", badgeClass: "bg-gold/25 text-foreground", desc: "Tedarikçilerinizle tek platformda buluşun", active: false },
  { title: "Ödeme & Marketplace", badge: "Yol haritasında", badgeClass: "bg-border text-muted-foreground", desc: "Masada ödeme, online sipariş, entegre ödeme altyapısı", active: false },
];

const RoadmapSection = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Sadece menü değil, ekosistem</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tabbled büyüyor. Restoranınızın tüm dijital ihtiyaçları tek platformda.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto mt-14">
          {/* Line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-border" />

          <div className="grid md:grid-cols-4 gap-8">
            {items.map((item, i) => (
              <div key={i} className="text-center relative">
                {/* Dot */}
                <div className={`w-4 h-4 rounded-full mx-auto mb-4 ${item.active ? "bg-sage shadow-lg shadow-sage/30" : "bg-border"}`} />
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${item.badgeClass}`}>
                  {item.badge}
                </span>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Tabbled'a bugün başlayın, ekosistem büyüdükçe siz de büyüyün.
        </p>
      </div>
    </section>
  );
};

export default RoadmapSection;
