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

const stats = [
  { value: "500+", label: "Aktif Restoran" },
  { value: "10.000+", label: "Günlük Görüntüleme" },
  { value: "34", label: "Farklı Dil" },
  { value: "%99.9", label: "Uptime Garantisi" },
];

const SocialProofStats = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className={`bg-[#F7F7F8] py-12 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-[#1C1C1E]">{s.value}</p>
              <p className="text-sm font-medium text-[#9CA3AF] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofStats;
