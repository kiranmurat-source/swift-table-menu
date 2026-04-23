import { WarningCircle } from "@phosphor-icons/react";
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

const avatarColors = ["#FF4F7A", "#FF7B9C", "#FFA5B8"];

const HeroSection = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className={`pt-28 pb-16 lg:pt-36 lg:pb-24 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full text-red-700 text-sm font-medium mb-6">
              <WarningCircle size={16} weight="thin" />
              <span>1 Ocak 2026'dan itibaren QR menü zorunlu!</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-[#1C1C1E] leading-[1.1] tracking-[-0.03em] mb-6">
              Restoranınız İçin{" "}
              <span className="text-[#FF4F7A]">Akıllı</span> Dijital Menü
            </h1>

            <p className="text-xl text-[#6B7280] leading-relaxed max-w-xl mb-8">
              AI destekli açıklamalar, 34 dilde otomatik çeviri, anlık tükendi güncellemesi.
              Tabbled ile menünüzü saniyeler içinde dijitalleştirin.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <a
                href="/login"
                className="inline-block text-white font-bold px-8 py-3.5 rounded-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #FF4F7A, #FF7B9C)",
                  boxShadow: "0 4px 14px rgba(255, 79, 122, 0.25)",
                }}
              >
                14 Gün Ücretsiz Deneyin
              </a>
              <a
                href="/menu/demo"
                className="inline-flex items-center gap-2 text-[#1C1C1E] font-medium px-8 py-3.5 rounded-lg border border-[#E5E7EB] hover:border-[#FF4F7A] hover:text-[#FF4F7A] transition-all duration-200"
              >
                Demo Menüyü İncele
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6">
              <div className="flex -space-x-2">
                {avatarColors.map((c, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c }}
                  >
                    {["A", "M", "S"][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-[#1C1C1E]">500+ Restoran</p>
                <p className="text-[#9CA3AF]">34 Dil Desteği</p>
              </div>
            </div>
          </div>

          {/* Right column: Phone mockup */}
          <div className="flex justify-center lg:justify-end relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4F7A]/10 to-transparent rounded-full blur-3xl" />
            <div
              className="relative rounded-[3rem] border-8 border-[#1C1C1E] overflow-hidden bg-white"
              style={{ width: 300, height: 580 }}
            >
              <div className="w-full h-full flex items-center justify-center bg-[#F7F7F8]">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF4F7A] mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">T</span>
                  </div>
                  <p className="text-sm font-bold text-[#1C1C1E] mb-1">Tabbled Demo Menü</p>
                  <p className="text-xs text-[#9CA3AF]">QR kodla tarayın</p>
                  <div className="mt-6 space-y-3">
                    {["Başlangıçlar", "Ana Yemekler", "İçecekler"].map((cat) => (
                      <div key={cat} className="bg-white rounded-xl p-3 shadow-sm text-left">
                        <p className="text-xs font-bold text-[#1C1C1E]">{cat}</p>
                        <div className="flex gap-2 mt-2">
                          <div className="w-8 h-8 rounded-lg bg-[#FFF0F3]" />
                          <div className="flex-1">
                            <div className="h-2 bg-[#E5E7EB] rounded w-3/4" />
                            <div className="h-2 bg-[#E5E7EB] rounded w-1/2 mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
