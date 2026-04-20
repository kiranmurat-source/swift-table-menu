// src/lib/menuHelpers.ts
// Pure utility functions for public menu display
// PublicMenu.tsx'ten çıkarıldı — state'siz, React'tan bağımsız helpers

import type { LangCode, UiLangCode, MenuItem, PriceVariant } from '../types/menu';

const STARTING_FROM_TEMPLATES: Record<UiLangCode, string> = {
  tr: "{price}'den başlayan",
  en: 'Starting from {price}',
  ar: 'يبدأ من {price}',
  zh: '起价 {price}',
};

// Map an arbitrary language code to the closest built-in UI language.
// Only tr/en/ar/zh have hardcoded UI strings; everything else falls back to en.
export function toUiLang(lang: string): UiLangCode {
  if (lang === 'tr' || lang === 'en' || lang === 'ar' || lang === 'zh') return lang;
  return 'en';
}

export function hasVariants(item: MenuItem): boolean {
  return Array.isArray(item.price_variants) && item.price_variants.length > 0;
}

export function minVariantPrice(item: MenuItem): number {
  if (!hasVariants(item)) return Number(item.price);
  return Math.min(...item.price_variants.map((v) => Number(v.price)));
}

export function formatPriceDisplay(item: MenuItem, uiLang: UiLangCode, format: (n: number) => string): string {
  if (hasVariants(item)) {
    const min = format(minVariantPrice(item));
    const template = STARTING_FROM_TEMPLATES[uiLang] || STARTING_FROM_TEMPLATES.en;
    return template.replace('{price}', min);
  }
  return format(Number(item.price));
}

export function variantDisplayName(v: PriceVariant, lang: LangCode): string {
  if (lang === 'en') return v.name_en?.trim() || v.name_tr;
  if (lang === 'tr') return v.name_tr;
  // Other languages: prefer EN, fallback TR
  return v.name_en?.trim() || v.name_tr;
}

export function isItemVisibleBySchedule(item: MenuItem, now: Date = new Date()): boolean {
  if (!item.schedule_type || item.schedule_type === 'always') return true;
  if (item.schedule_type === 'date_range') {
    const start = item.schedule_start ? new Date(item.schedule_start) : null;
    const end = item.schedule_end ? new Date(item.schedule_end) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  }
  if (item.schedule_type === 'periodic') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const today = days[now.getDay()];
    const d = item.schedule_periodic?.[today];
    if (!d || !d.enabled) return false;
    if (d.all_day) return true;
    if (!d.start || !d.end) return true;
    const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return cur >= d.start && cur <= d.end;
  }
  return true;
}

export function isHappyHourActive(item: MenuItem): boolean {
  if (!item.happy_hour_active) return false;
  if (!item.happy_hour_start_time || !item.happy_hour_end_time) return false;

  const now = new Date();

  // Day check
  if (item.happy_hour_days && item.happy_hour_days.length > 0) {
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = dayMap[now.getDay()];
    if (!item.happy_hour_days.includes(today)) return false;
  }

  // Time check
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = item.happy_hour_start_time.split(':').map(Number);
  const [endH, endM] = item.happy_hour_end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Midnight-crossing range (e.g. 22:00-02:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function parseVideoEmbed(url: string | null | undefined): { type: 'youtube' | 'vimeo' | 'direct'; src: string } | null {
  if (!url) return null;
  const v = url.trim();
  const yt = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { type: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1` };
  const vm = v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { type: 'direct', src: v };
}
