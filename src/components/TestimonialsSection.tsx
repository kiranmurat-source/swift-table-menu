import { Star } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const testimonials = [
  { text: "Dijital menüye geçtik, garson verimliliğimiz gözle görülür arttı. Misafirler çok memnun.", name: "Ahmet Y.", title: "Otel F&B Müdürü", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
  { text: "Misafirlerimiz artık garson beklemeden sipariş veriyor. Servis hızımız %40 arttı.", name: "Selin K.", title: "Restoran Müdürü", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80" },
  { text: "4 dil desteği sayesinde yabancı misafirlerimiz çok memnun.", name: "Mehmet D.", title: "Butik Otel Sahibi", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
  { text: "QR menü kurulumu 15 dakika sürdü. Admin panel çok kolay.", name: "Zeynep A.", title: "Kafe İşletmecisi", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80" },
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
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
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
