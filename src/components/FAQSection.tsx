import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const faqs = [
  { q: "Tabbled nedir?", a: "Tabbled, otel ve restoranlar için geliştirilmiş QR dijital menü ve sipariş yönetim platformudur. Misafirler QR kodu tarayarak menüye ulaşır, sipariş verir ve garson çağırabilir." },
  { q: "Kurulum ne kadar sürer?", a: "Admin panelden menünüzü 15-30 dakikada oluşturabilirsiniz. QR kodlarınız otomatik olarak üretilir, yazdırıp masalara yerleştirmeniz yeterli." },
  { q: "Hangi cihazlarda çalışır?", a: "Tabbled tüm modern tarayıcılarda çalışır. Misafirlerinizin uygulama indirmesine gerek yoktur — iPhone, Android, tablet fark etmez." },
  { q: "Kaç dil destekleniyor?", a: "Şu anda Türkçe, İngilizce, Arapça ve Fransızca desteklenmektedir. Tüm planlarda 4 dil dahildir." },
  { q: "Sözleşme zorunlu mu?", a: "Hayır, aylık abonelik sistemiyle çalışıyoruz. İstediğiniz zaman iptal edebilirsiniz." },
  { q: "Diğer QR menü çözümlerinden farkı nedir?", a: "Tabbled, masadan sipariş, garson çağır ve sipariş takibi gibi özellikleri uygun fiyatla sunar. 4 dil desteği ve sınırsız masa tüm planlarda dahildir." },
  { q: "Alerjen bilgileri nasıl eklenir?", a: "Admin panelden her ürüne alerjen bilgilerini tek tek ekleyebilirsiniz. Misafirler menüde alerjen ikonlarını görebilir." },
  { q: "Ödeme yöntemleri nelerdir?", a: "Kredi kartı ve banka havalesi ile ödeme yapabilirsiniz. Yıllık planlarda indirim uygulanır." },
  { q: "Ücretsiz deneme nasıl çalışır?", a: "14 gün boyunca tüm Profesyonel plan özelliklerini ücretsiz kullanabilirsiniz. Kredi kartı bilgisi gerekmez." },
  { q: "Destek nasıl alırım?", a: "E-posta ve canlı destek ile 7/24 yanınızdayız. Profesyonel ve Kurumsal planlarda öncelikli destek sağlıyoruz." },
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
