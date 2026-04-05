import { CiStar } from "react-icons/ci";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const testimonials = [
  { text: "Dijital menüye geçtik, garson verimliliğimiz gözle görülür arttı. Misafirler çok memnun.", name: "Ahmet Y.", title: "Otel F&B Müdürü" },
  { text: "Misafirlerimiz artık garson beklemeden sipariş veriyor. Servis hızımız %40 arttı.", name: "Selin K.", title: "Restoran Müdürü" },
  { text: "4 dil desteği sayesinde yabancı misafirlerimiz çok memnun.", name: "Mehmet D.", title: "Butik Otel Sahibi" },
  { text: "QR menü kurulumu 15 dakika sürdü. Admin panel çok kolay.", name: "Zeynep A.", title: "Kafe İşletmecisi" },
];

const TestimonialsSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="demo" className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Müşterilerimiz ne diyor?</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-sage/40 transition-all duration-200">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <CiStar key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
