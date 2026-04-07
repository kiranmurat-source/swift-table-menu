import { useEffect, useState } from 'react';
import { CiCircleRemove } from 'react-icons/ci';
import type { MenuTheme } from '../lib/themes';

export interface Promo {
  id: string;
  title_tr: string;
  title_en: string | null;
  description_tr: string | null;
  description_en: string | null;
  image_url: string | null;
  cta_text_tr: string | null;
  cta_text_en: string | null;
  cta_url: string | null;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_start_time: string; // 'HH:MM' or 'HH:MM:SS'
  schedule_end_time: string;
  schedule_days: number[];
  show_once_per_session: boolean;
  sort_order: number;
}

export function isPromoVisible(promo: Promo): boolean {
  if (!promo.is_active) return false;

  if (promo.schedule_enabled) {
    const now = new Date();
    const currentDay = now.getDay();
    if (!promo.schedule_days?.includes(currentDay)) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (promo.schedule_start_time || '00:00').split(':').map(Number);
    const [endH, endM] = (promo.schedule_end_time || '23:59').split(':').map(Number);
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    if (currentTime < startMinutes || currentTime > endMinutes) return false;
  }

  if (promo.show_once_per_session) {
    const shown = sessionStorage.getItem(`promo_shown_${promo.id}`);
    if (shown) return false;
  }

  return true;
}

function formatTimeRange(start: string, end: string): string {
  const fmt = (s: string) => s.split(':').slice(0, 2).join(':');
  return `${fmt(start)} - ${fmt(end)}`;
}

interface PromoPopupProps {
  promo: Promo;
  theme: MenuTheme;
  lang: 'tr' | 'en' | 'ar' | 'zh';
  onClose: () => void;
}

export default function PromoPopup({ promo, theme, lang, onClose }: PromoPopupProps) {
  const [visible, setVisible] = useState(false);
  const headingFont = "'Playfair Display', serif";
  const bodyFont = "'Inter', sans-serif";

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(id);
  }, []);

  const pickLocalized = (tr: string | null | undefined, en: string | null | undefined): string => {
    if (lang !== 'tr') {
      const v = en?.trim();
      if (v) return v;
    }
    return (tr || '').trim();
  };

  const title = pickLocalized(promo.title_tr, promo.title_en);
  const description = pickLocalized(promo.description_tr, promo.description_en);
  const ctaText = pickLocalized(promo.cta_text_tr, promo.cta_text_en);

  const handleClose = () => {
    if (promo.show_once_per_session) {
      sessionStorage.setItem(`promo_shown_${promo.id}`, '1');
    }
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleCta = () => {
    if (promo.cta_url) {
      window.open(promo.cta_url, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={handleClose}
      style={{
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-3xl shadow-2xl overflow-hidden"
        style={{
          maxWidth: 400,
          backgroundColor: theme.cardBg,
          color: theme.text,
          fontFamily: bodyFont,
          border: `1px solid ${theme.cardBorder}`,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFFFFF' }}
        >
          <CiCircleRemove size={20} />
        </button>

        {promo.image_url && (
          <img
            src={promo.image_url}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: 200 }}
          />
        )}

        <div className="p-5">
          {title && (
            <h2
              className="text-xl leading-tight mb-2"
              style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: theme.text, fontWeight: 400 }}>
              {description}
            </p>
          )}
          {promo.schedule_enabled && (
            <p className="text-xs mb-4" style={{ color: theme.mutedText, fontWeight: 300 }}>
              {formatTimeRange(promo.schedule_start_time, promo.schedule_end_time)}
            </p>
          )}
          {ctaText && (
            <button
              onClick={handleCta}
              className="w-full py-3 rounded-full text-sm shadow-lg transition-all"
              style={{
                backgroundColor: theme.accent,
                color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
                fontWeight: 600,
                minHeight: 44,
              }}
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
