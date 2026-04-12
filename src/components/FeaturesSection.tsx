import {
  QrCode,
  BellRinging,
  WhatsappLogo,
  ShoppingCart,
  Warning,
  XCircle,
  Clock,
  ChartBar,
} from "@phosphor-icons/react";
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

const features = [
  { icon: QrCode, title: "QR Dijital Menü", desc: "Temassız, güvenli ve şık bir menü deneyimi sunun." },
  { icon: BellRinging, title: "Garson Çağırma", desc: "Müşterileriniz tek tıkla dijital olarak garson çağırsın." },
  { icon: WhatsappLogo, title: "WhatsApp Sipariş", desc: "Doğrudan WhatsApp hattınıza sipariş yönlendirin." },
  { icon: ShoppingCart, title: "Online Sipariş", desc: "Masadan veya paket servis için anlık sipariş alın." },
  { icon: Warning, title: "Alerjen Bilgisi", desc: "14 AB alerjeni + vegan/vegetarian/helal etiketleri." },
  { icon: XCircle, title: "Tükendi Güncelleme", desc: "Biten ürünleri anında menüden kaldırın." },
  { icon: Clock, title: "Happy Hour", desc: "Zamanlı fiyat ve menü değişiklikleri otomatik aktif olsun." },
  { icon: ChartBar, title: "Analitik Dashboard", desc: "En çok satan ürünleri ve müşteri davranışlarını izleyin." },
];

const FeaturesSection = () => {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className={`py-20 lg:py-28 transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl bg-white group transition-all duration-300 cursor-default hover:bg-[#FF4F7A]"
              style={{ boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" }}
            >
              <f.icon
                size={32}
                weight="thin"
                className="text-[#FF4F7A] group-hover:text-white transition-colors"
              />
              <h3 className="text-lg font-bold mt-4 mb-2 text-[#1C1C1E] group-hover:text-white transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[#6B7280] group-hover:text-white/80 transition-colors">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
