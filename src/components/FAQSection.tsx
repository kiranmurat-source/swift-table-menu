import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  { q: "Tabbled nedir?", a: "Tabbled, restoran ve oteller için geliştirilmiş QR dijital menü platformudur. Misafirler QR kodu tarayarak menüye ulaşır, alerjen ve kalori bilgilerini görebilir." },
  { q: "Kurulum ne kadar sürer?", a: "Admin panelden menünüzü 15-30 dakikada oluşturabilirsiniz. QR kodlarınız otomatik olarak üretilir, yazdırıp masalara yerleştirmeniz yeterli." },
  { q: "Hangi cihazlarda çalışır?", a: "Tabbled tüm modern tarayıcılarda çalışır. Misafirlerinizin uygulama indirmesine gerek yoktur — iPhone, Android, tablet fark etmez." },
  { q: "Çok dilli menü hangi planlarda var?", a: "Basic planda menü tek dildir. Pro planda 2 dil, Premium planda 4 dil desteği bulunur." },
  { q: "Abonelik nasıl çalışır?", a: "Sadece yıllık abonelik sistemiyle çalışıyoruz. Kurulum ücreti yoktur. Ödeme banka havalesi veya kredi kartı ile yapılabilir." },
  { q: "Ücretsiz deneme var mı?", a: "Ücretsiz deneme süresi bulunmamaktadır. Ancak demo menümüzü inceleyerek platformun nasıl çalıştığını görebilirsiniz." },
  { q: "QR menü yasal zorunluluk mu?", a: "Evet, Fiyat Etiketi Yönetmeliği kapsamında 1 Ocak 2026 itibarıyla dijital menü zorunlu hale gelmiştir." },
  { q: "Alerjen bilgileri nasıl eklenir?", a: "Admin panelden her ürüne alerjen bilgilerini (gluten, süt, yumurta, fıstık vb.) ve kalori değerlerini ekleyebilirsiniz. Misafirler menüde bu bilgileri görebilir." },
  { q: "Garson çağırma ve sipariş özellikleri hangi planlarda?", a: "Garson çağırma ve WhatsApp sipariş Pro ve Premium planlarda mevcuttur. Online sipariş, masadan ödeme ve teslimat sadece Premium planda bulunur." },
  { q: "Destek nasıl alırım?", a: "Tüm planlarda e-posta desteği mevcuttur. Premium planda öncelikli destek sağlanır." },
];

const FAQSection = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-20 lg:py-28">
      <div ref={ref} className="container mx-auto px-4 lg:px-8 section-fade-in max-w-3xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Sıkça Sorulan Sorular</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-6 data-[state=open]:border-sage/40 transition-colors">
              <AccordionTrigger className="text-left font-semibold text-sm hover:no-underline py-4">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
