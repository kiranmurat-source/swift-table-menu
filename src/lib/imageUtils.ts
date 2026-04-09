/**
 * Supabase Storage image URL'ini optimize edilmiş versiyona dönüştürür.
 * /object/public/ → /render/image/public/ + width & quality parametreleri ekler.
 *
 * Sadece Supabase Storage URL'leri dönüştürülür — harici URL'ler aynen döner.
 */

import { supabaseUrl as SUPABASE_URL } from './supabase';

const STORAGE_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export type ImageSize = 'thumbnail' | 'card' | 'detail' | 'cover' | 'original';

const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number; resize: 'contain' | 'cover' }> = {
  thumbnail: { width: 80,  quality: 60, resize: 'contain' }, // Kategori ikonları, küçük logo
  card:      { width: 200, quality: 70, resize: 'contain' }, // Ürün kartları, admin list
  detail:    { width: 480, quality: 80, resize: 'contain' }, // Ürün detay modalı, featured kart
  cover:     { width: 800, quality: 75, resize: 'cover'   }, // Kapak görseli — tam dolması için cover
  original:  { width: 0,   quality: 100, resize: 'contain' }, // Orijinal — dönüşüm yapma
};

export function getOptimizedImageUrl(
  url: string | null | undefined,
  size: ImageSize = 'card',
): string {
  if (!url) return '';

  // Sadece Supabase Storage URL'leri dönüştürülür
  if (!url.includes(SUPABASE_URL) || !url.includes(STORAGE_PATH)) {
    return url;
  }

  if (size === 'original') return url;

  const config = SIZE_CONFIG[size];
  const renderUrl = url.replace(STORAGE_PATH, RENDER_PATH);
  const separator = renderUrl.includes('?') ? '&' : '?';
  return `${renderUrl}${separator}width=${config.width}&quality=${config.quality}&resize=${config.resize}`;
}

/**
 * onError fallback for <img> tags.
 *
 * Strategy:
 * 1. If the URL is an optimized Supabase render URL (/render/image/), fall
 *    back to the raw /object/ URL. This covers the case where Image Transforms
 *    (Pro plan) become unavailable or return an error for a specific asset.
 * 2. If the raw object URL also fails (or the src is already non-render),
 *    swap in the bundled placeholder SVG so the UI never shows a broken icon.
 *
 * Each <img> is only redirected once per fallback step — the `data-fallback`
 * attribute tracks which stage we're in to prevent infinite error loops.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  const stage = img.dataset.fallback || 'none';
  const src = img.src;

  if (stage === 'none' && src.includes('/render/image/')) {
    // Stage 1: downgrade render URL → raw object URL
    img.dataset.fallback = 'raw';
    img.src = src.replace('/render/image/', '/object/').split('?')[0];
    return;
  }

  if (stage !== 'placeholder') {
    // Stage 2: give up, show placeholder
    img.dataset.fallback = 'placeholder';
    img.src = '/placeholder-food.svg';
    img.style.objectFit = 'contain';
    img.style.opacity = '0.4';
  }
}
