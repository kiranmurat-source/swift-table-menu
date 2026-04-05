import { Button } from "@/components/ui/button";
import { CiCircleChevRight, CiBoxes, CiGlobe, CiWavePulse1, CiBellOn } from "react-icons/ci";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const values = [
  { icon: CiBoxes, title: "Sınırsız ürün & kategori", desc: "Menünüzde istediğiniz kadar kategori ve ürün olsun. Tüm planlarda sınırsız." },
  { icon: CiGlobe, title: "Çok dilli menü", desc: "Pro'da 2 dil, Premium'da 4 dil. Yabancı misafirleriniz kendi dilinde görsün." },
  { icon: CiWavePulse1, title: "Alerjen & kalori bilgisi", desc: "Her üründe alerjen ikonları ve kalori değeri. Misafir güvenle sipariş verir." },
  { icon: CiBellOn, title: "Yasal uyumluluk", desc: "1 Ocak 2026 itibarıyla dijital menü zorunlu. Tabbled ile hemen uyumlu olun." },
];

const ValueProposition = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Neden Tabbled?</h2>
          <p className="text-muted-foreground text-lg">Kurumsal kalite, işletme dostu fiyat</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          {values.map((v) => (
            <div key={v.title} className="p-6 rounded-2xl bg-card border border-border hover:border-sage/40 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-sage/15 flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-sage" />
              </div>
              <h3 className="text-base font-bold mb-1">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#fiyatlar">
            <Button variant="hero" size="lg" className="rounded-full px-8 text-base" onClick={(e) => { e.preventDefault(); document.querySelector('#fiyatlar')?.scrollIntoView({ behavior: 'smooth' }); }}>
              Planları İncele <CiCircleChevRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
