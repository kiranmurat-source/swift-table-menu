import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  { num: "01", title: "Menünüzü yükleyin", desc: "Admin panelden kategoriler, ürünler, fotoğraflar ve fiyatları girin." },
  { num: "02", title: "QR kodları oluşturun", desc: "Her masa için otomatik QR kod. Yazdırın, masalara yerleştirin." },
  { num: "03", title: "Siparişleri yönetin", desc: "Misafir siparişleri canlı olarak admin panelde görünür." },
];

const HowItWorks = () => {
  const ref = useScrollReveal();

  return (
    <section id="nasil-calisir" className="py-20 lg:py-28 bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.06]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=60')" }}
      />
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Nasıl Çalışır?</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-14 h-14 rounded-xl bg-grapefruit text-card flex items-center justify-center text-xl font-extrabold font-heading shadow-lg mx-auto mb-5">
                {s.num}
              </div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
