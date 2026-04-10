import { Barcode, ShoppingCart, Bell, Kanban, Globe, Pulse } from "@phosphor-icons/react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  { icon: Barcode, title: "QR Menü", desc: "Misafir QR kodu tarar, menü anında açılır. Uygulama indirmeye gerek yok. Tüm planlarda.", color: "bg-grapefruit/10 text-grapefruit" },
  { icon: ShoppingCart, title: "Online Sipariş", desc: "Masadan sipariş, WhatsApp sipariş ve kendi teslimat altyapınız. Pro ve Premium.", color: "bg-sage/15 text-sage" },
  { icon: Bell, title: "Garson Çağır", desc: "Tek tuşla garson çağırma. Pro ve Premium planlarda.", color: "bg-salmon/15 text-salmon" },
  { icon: Pulse, title: "Alerjen & Kalori", desc: "Her üründe alerjen ikonları ve kalori bilgisi. Misafir güvenle sipariş verir. Tüm planlarda.", color: "bg-gold/20 text-foreground" },
  { icon: Globe, title: "Çok Dilli Menü", desc: "Pro'da 2 dil, Premium'da 4 dil desteği. Yabancı misafirlerinize hitap edin.", color: "bg-sage-light/20 text-sage" },
  { icon: Kanban, title: "Analytics & Raporlama", desc: "Hangi ürün çok görüntüleniyor? Kategori performansı ve trendler. Premium.", color: "bg-grapefruit/10 text-grapefruit" },
];

const FeaturesSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="ozellikler" className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Tek platform, sınırsız olanak</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-sage/40 hover:scale-[1.01] transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
