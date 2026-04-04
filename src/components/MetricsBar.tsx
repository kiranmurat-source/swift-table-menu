import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const metrics = [
  { value: "40+", label: "Özellik" },
  { value: "4 Dil", label: "Menü Desteği" },
  { value: "₺300", label: "Başlangıç Fiyatı/ay" },
  { value: "₺0", label: "Kurulum Ücreti" },
];

const MetricsBar = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-16 bg-cream">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-4xl sm:text-5xl font-extrabold text-grapefruit mb-1">{m.value}</p>
              <p className="text-sm text-muted-foreground font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsBar;
