// src/components/menu/BentoCategoryCard.tsx
// Bento/masonry layout'ta kategori kartı
// IntersectionObserver ile scroll animasyonu (opacity + scale)
// PublicMenu.tsx'ten çıkarıldı

import { useState, useEffect, useRef } from 'react';
import type { LangCode, MenuCategory, Translations } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { getOptimizedImageUrl, handleImageError } from '../../lib/imageUtils';

function t(
  translations: Translations | null | undefined,
  field: string,
  fallback: string | null | undefined,
  lang: LangCode,
  englishFallback?: string | null,
): string {
  if (lang === 'tr') return fallback ?? '';
  if (lang === 'en' && englishFallback && englishFallback.trim() !== '') {
    return englishFallback;
  }
  const val = translations?.[lang]?.[field as keyof Translations[string]];
  if (val && typeof val === 'string' && val.trim() !== '') return val;
  return fallback ?? '';
}

export function BentoCategoryCard({
  cat, count, lang, theme, headingFont, isFull, delay, itemsLabel, onClick,
}: {
  cat: MenuCategory;
  count: number;
  lang: LangCode;
  theme: MenuTheme;
  headingFont: string;
  isFull: boolean;
  delay: number;
  itemsLabel: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const img = cat.image_url ? getOptimizedImageUrl(cat.image_url, 'card') : '';
  const rawVideo = cat.video_url?.trim() || '';
  // Bento kartta sadece doğrudan .mp4/.webm dosya URL'leri oynar (iframe autoplay kısıtlamaları)
  const isDirectVideo = !!rawVideo && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(rawVideo);
  const video = isDirectVideo ? rawVideo : '';
  const name = t(cat.translations, 'name', cat.name_tr, lang);
  const desc = t(cat.translations, 'description', cat.description_tr, lang);
  const isDarkTheme = theme.cardBg !== '#FFFFFF';
  const fallbackBg = isDarkTheme
    ? 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)'
    : 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)';
  const overlayMax = isDarkTheme ? 0.8 : 0.7;
  const hasMedia = !!(video || img);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative overflow-hidden text-left bento-cat-card"
      style={{
        width: isFull ? '100%' : 'calc(50% - 4px)',
        height: isFull ? 200 : 220,
        borderRadius: 12,
        background: hasMedia ? '#000' : fallbackBg,
        cursor: 'pointer',
        padding: 0,
        border: 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.92)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
      }}
    >
      {video ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={img || undefined}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={video} type={video.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : img && (
        <img
          src={img}
          alt={name}
          onError={handleImageError}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, rgba(0,0,0,${overlayMax}) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 16, right: 16, bottom: 16,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: headingFont,
            fontWeight: 700,
            fontSize: isFull ? 18 : 16,
            letterSpacing: '-0.01em',
            color: '#FFFFFF',
            lineHeight: 1.2,
          }}
        >
          {name}
        </span>
        {desc && (
          <span
            style={{
              fontWeight: 300,
              fontSize: 13,
              color: '#FFFFFF',
              opacity: 0.85,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {desc}
          </span>
        )}
        <span
          style={{
            fontWeight: 400,
            fontSize: 12,
            color: '#FFFFFF',
            opacity: 0.7,
            marginTop: 2,
          }}
        >
          {count} {itemsLabel}
        </span>
      </div>
    </button>
  );
}
