import { PencilLine, Translate, Leaf } from "@phosphor-icons/react";
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

const cards = [
  {
    icon: PencilLine,
    title: "AI Menü Açıklaması",
    desc: "Ürün adını yazın, yapay zeka saniyeler içinde iştah açıcı açıklamalar üretsin. Profesyonel, samimi veya lüks — 3 farklı ton seçeneği.",
    demo: (
      <div className="bg-[#F7F7F8] rounded-lg p-4 text-sm">
        <p className="text-[#9CA3AF] text-xs mb-2">Örnek çıktı:</p>
        <p className="text-[#1C1C1E] italic">
          "Taze fırından çıkmış lahmacun, ince açılmış hamuru ve
          özel baharatlı et harcıyla damak çatlatan bir lezzet..."
        </p>
      </div>
    ),
  },
  {
    icon: Translate,
    title: "34 Dilde Akıllı Çeviri",
    desc: "Menünüzü Türkçe yazın, tek tıkla 34 dile çevirsin. Turist misafirleriniz kendi dilinde sipariş versin.",
    demo: (
      <div className="bg-[#F7F7F8] rounded-lg p-4 text-sm space-y-2">
        <p className="text-[#9CA3AF] text-xs mb-2">Çeviri önizleme:</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#FF4F7A] w-6">TR</span>
          <span className="text-[#1C1C1E]">Lahmacun</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#FF4F7A] w-6">EN</span>
          <span className="text-[#1C1C1E]">Turkish Flatbread with Spiced Meat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#FF4F7A] w-6">AR</span>
          <span className="text-[#1C1C1E]" dir="rtl">لحم بعجين</span>
        </div>
      </div>
    ),
  },
  {
    icon: Leaf,
    title: "Detaylı Besin Bilgisi",
    desc: "AB uyumlu besin değerleri tablosu. Enerji, yağ, karbonhidrat, protein, tuz — trafik ışığı renk kodlarıyla.",
    demo: (
      <div className="bg-[#F7F7F8] rounded-lg p-4 text-sm">
        <p className="text-[#9CA3AF] text-xs mb-3">Besin değerleri:</p>
        <div className="space-y-2">
          {[
            { label: "Enerji", value: "285 kcal", color: "#F59E0B" },
            { label: "Yağ", value: "12g", color: "#EF4444" },
            { label: "Karbonhidrat", value: "32g", color: "#F59E0B" },
            { label: "Protein", value: "14g", color: "#22C55E" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: n.color }}
                />
                <span className="text-[#6B7280] text-xs">{n.label}</span>
              </div>
              <span className="text-[#1C1C1E] text-xs font-medium">{n.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const AIShowcase = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      id="ozellikler"
      className={`py-20 lg:py-28 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#1C1C1E]">
            Yapay Zeka ile <span className="text-[#FF4F7A]">Güçlendirilmiş</span> Menü
          </h2>
          <p className="text-[#6B7280] mt-4 max-w-2xl mx-auto">
            Tabbled'ın AI araçları, menünüzü daha etkili hale getirir ve operasyonel yükü azaltır.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-8 border border-gray-100 group transition-all duration-300 hover:shadow-[0_32px_64px_-16px_rgba(255,79,122,0.15)]"
              style={{ boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-[#FFF0F3] flex items-center justify-center mb-6">
                <card.icon size={28} weight="thin" className="text-[#FF4F7A]" />
              </div>

              <h3 className="text-xl font-bold text-[#1C1C1E] mb-3">{card.title}</h3>
              <p className="text-[#6B7280] leading-relaxed mb-6">{card.desc}</p>

              {card.demo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIShowcase;
