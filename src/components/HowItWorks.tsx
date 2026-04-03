import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import PhoneMockup from "@/components/PhoneMockup";

const steps = [
  { num: "01", title: "Menünüzü yükleyin", desc: "Admin panelden kategoriler, ürünler, fotoğraflar ve fiyatları girin." },
  { num: "02", title: "QR kodları oluşturun", desc: "Her masa için otomatik QR kod. Yazdırın, masalara yerleştirin." },
  { num: "03", title: "Siparişleri yönetin", desc: "Misafir siparişleri canlı olarak admin panelde görünür." },
];

const HowItWorks = () => {
  const ref = useScrollReveal();

  return (
    <section id="nasil-calisir" className="py-20 lg:py-28 bg-cream">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Nasıl Çalışır?</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Steps */}
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-grapefruit text-card flex items-center justify-center text-xl font-extrabold font-heading shadow-lg flex-shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
