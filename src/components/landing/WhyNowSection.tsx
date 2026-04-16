import React from "react";
import { ArrowRight } from "@phosphor-icons/react";

const DEMO_MENU_URL = "https://tabbled.com/r/ramada-encore-bayrampasa";

const handleDemoClick = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'demo_menu_click', {
      event_category: 'engagement',
      event_label: 'why_now_cta',
    });
  }
};

export function WhyNowSection() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28 bg-[#1C1C1E] text-white">
      <div className="container max-w-lg text-center">
        <h1 className="mb-5 text-6xl font-bold md:mb-6 md:text-9xl lg:text-10xl">
          Neden şimdi
        </h1>
        <p className="md:text-md">
          QR menü artık başlangıç noktası. Bugünün restoranları; dijital menü
          yönetimi, çok dilli menü yayını, garson çağırma, misafir geri
          bildirimi ve daha güçlü operasyon kontrolünü aynı sistem içinde
          istiyor. Tabbled, restoranlar için bu süreci sadeleştiren modern bir
          dijital menü ve misafir deneyimi platformu sunar.
        </p>

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a
            href={DEMO_MENU_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Canlı demo menüyü yeni sekmede aç"
            onClick={handleDemoClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#FF4F7A',
              color: '#FFFFFF',
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 500,
              fontSize: 16,
              padding: '16px 32px',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#E5456C';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#FF4F7A';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Canlı Demo Menüyü Gör
            <ArrowRight size={20} weight="thin" />
          </a>
          <p
            style={{
              marginTop: 16,
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: "'Roboto', sans-serif",
              fontWeight: 400,
              fontSize: 14,
            }}
          >
            Ramada Encore by Wyndham İstanbul — aktif müşterimiz
          </p>
        </div>
      </div>
    </section>
  );
}
