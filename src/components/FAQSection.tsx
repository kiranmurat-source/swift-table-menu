import { CaretDown } from "@phosphor-icons/react";
import { useRef, useState, useEffect } from "react";

const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
};

const faqs = [
  {
    q: "Tabbled'ı kullanmaya nasıl başlarım?",
    a: "14 gün ücretsiz deneme ile başlayın — kredi kartı gerekmez. İletişim sayfamızdan bize ulaşın, ekibimiz işletmenize özel hesabınızı dakikalar içinde oluşturur.",
  },
  {
    q: "Müşterilerimin uygulama indirmesi gerekiyor mu?",
    a: "Hayır, Tabbled tamamen web tabanlıdır. Müşterileriniz sadece QR kodu taratarak tarayıcı üzerinden menünüze ulaşır. Herhangi bir indirme gerekmez.",
  },
  {
    q: "QR menü yasal olarak zorunlu mu?",
    a: "Evet, 1 Ocak 2026 itibarıyla Fiyat Etiketi Yönetmeliği kapsamında işletmelerin dijital menü sunması zorunlu hale gelmiştir. Tabbled ile bu zorunluluğu kolayca karşılayabilirsiniz.",
  },
  {
    q: "Çok dilli çeviri nasıl çalışıyor?",
    a: "Menünüzü Türkçe olarak oluşturun, Çeviri Merkezi'nden tek tıkla 34 farklı dile profesyonelce çevirebilirsiniz. Turist misafirleriniz kendi dilinde sipariş verir.",
  },
  {
    q: "Yıllık ödeme zorunlu mu?",
    a: "Evet, tüm paketlerimiz yıllık ödeme ile sunulmaktadır. Bu sayede aylık maliyetinizi düşük tutuyoruz.",
  },
  {
    q: "Mevcut menümü sisteme nasıl aktarırım?",
    a: "Admin panelinizden kategorilerinizi ve ürünlerinizi kolayca ekleyebilirsiniz. Fotoğraf yükleme, alerjen seçimi ve AI destekli açıklama yazma ile menünüzü hızlıca oluşturabilirsiniz.",
  },
];

const FAQSection = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      id="sss"
      className={`py-20 lg:py-28 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#1C1C1E]">
            Sıkça Sorulan Sorular
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-white p-6 rounded-xl cursor-pointer border border-gray-100 transition-all open:shadow-md"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            >
              <summary className="flex justify-between items-center font-bold text-lg list-none text-[#1C1C1E] [&::-webkit-details-marker]:hidden">
                {f.q}
                <CaretDown
                  size={20}
                  weight="thin"
                  className="text-[#9CA3AF] group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                />
              </summary>
              <p className="mt-4 text-[#6B7280] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
