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

const steps = [
  {
    num: 1,
    title: "Ücretsiz Deneyin",
    desc: "14 günlük ücretsiz denemenizi başlatın. Kredi kartı gerekmez, iletişim formunu doldurun yeter.",
  },
  {
    num: 2,
    title: "Menünüzü Oluşturun",
    desc: "Ürünlerinizi, fiyatlarınızı ve görsellerinizi admin panelinden kolayca ekleyin. AI açıklamalarla süresini yarıya indirin.",
  },
  {
    num: 3,
    title: "QR Kodu Paylaşın",
    desc: "Size özel oluşturulan QR kodlarını masalarınıza yerleştirin ve dijital menünüzü yayına alın.",
  },
];

const HowItWorks = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      id="nasil-calisir"
      className={`py-20 lg:py-28 bg-[#F7F7F8] transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#1C1C1E]">
            Nasıl Çalışır?
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Steps */}
          <div className="space-y-10">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FF4F7A] text-white flex items-center justify-center font-bold text-xl">
                  {s.num}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#1C1C1E] mb-2">{s.title}</h4>
                  <p className="text-[#6B7280] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Dashboard mockup */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden w-full max-w-md"
              style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
            >
              <div className="bg-[#1C1C1E] px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-[#9CA3AF]">admin.tabbled.com</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Toplam Görüntüleme</p>
                    <p className="text-2xl font-bold text-[#1C1C1E]">1,234</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF]">Aktif Masalar</p>
                    <p className="text-2xl font-bold text-[#FF4F7A]">18</p>
                  </div>
                </div>
                <div className="h-px bg-[#E5E7EB]" />
                <div className="space-y-3">
                  {["Başlangıçlar", "Ana Yemekler", "Tatlılar"].map((cat, i) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-[#1C1C1E]">{cat}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-[#FF4F7A]" style={{ width: [100, 160, 70][i] }} />
                        <span className="text-xs text-[#9CA3AF]">{[24, 38, 18][i]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
