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

const CTABanner = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className={`max-w-7xl mx-auto px-6 py-20 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div
        className="rounded-[2rem] p-12 lg:p-20 text-center text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FF4F7A 0%, #FF7B9C 100%)" }}
      >
        {/* Decorative blur blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <h2 className="text-4xl lg:text-5xl font-bold mb-6 relative z-10">
          Restoranınızı Dijitale Taşıyın
        </h2>
        <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto relative z-10">
          Yasal zorunluluğu fırsata çevirin. 14 gün ücretsiz deneyin,
          kredi kartı gerekmez.
        </p>
        <a
          href="/iletisim"
          className="inline-block bg-white text-[#FF4F7A] px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl relative z-10"
        >
          14 Gün Ücretsiz Deneyin
        </a>
      </div>
    </section>
  );
};

export default CTABanner;
