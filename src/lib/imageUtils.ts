/**
 * Supabase Storage image URL'ini optimize edilmiş versiyona dönüştürür.
 * /object/public/ → /render/image/public/ + width & quality parametreleri ekler.
 *
 * Sadece Supabase Storage URL'leri dönüştürülür — harici URL'ler aynen döner.
 */

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';
const STORAGE_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export type ImageSize = 'thumbnail' | 'card' | 'detail' | 'cover' | 'original';

const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number }> = {
  thumbnail: { width: 80, quality: 60 },   // Kategori ikonları, küçük logo
  card:      { width: 200, quality: 70 },  // Ürün kartları, admin list
  detail:    { width: 480, quality: 80 },  // Ürün detay modalı, featured kart
  cover:     { width: 800, quality: 75 },  // Kapak görseli, splash
  original:  { width: 0, quality: 100 },   // Orijinal — dönüşüm yapma
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
  return `${renderUrl}${separator}width=${config.width}&quality=${config.quality}`;
}
