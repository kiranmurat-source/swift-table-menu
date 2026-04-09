# TABBLED — FOTOĞRAF OPTİMİZASYONU (Supabase Image Transforms)
## Claude Code Prompt — 11 Nisan 2026

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled/
- **Stack:** React + Vite + TypeScript + Supabase
- **Supabase:** qmnrawqvkwehufebbkxp.supabase.co
- **Storage bucket:** menu-images (public)
- **Dosyalar:** src/pages/PublicMenu.tsx, src/pages/RestaurantDashboard.tsx

---

## SORUN

Restoran fotoğrafları orijinal boyutlarında yükleniyor (1-3MB arası olabiliyor). Public menüde 76 ürünlük bir menü açılınca yavaş yükleniyor.

---

## ÇÖZÜM: Supabase Storage Image Transforms

Supabase Storage, URL'e parametre ekleyerek sunucu tarafında fotoğrafları küçültüp optimize eder. Orijinal dosyaya dokunmadan, farklı boyutları dinamik olarak üretir. Otomatik WebP dönüşümü de yapar.

### URL Yapısı

Mevcut (orijinal boyut):
```
https://qmnrawqvkwehufebbkxp.supabase.co/storage/v1/object/public/menu-images/foto.jpg
```

Optimize (küçültülmüş):
```
https://qmnrawqvkwehufebbkxp.supabase.co/storage/v1/render/image/public/menu-images/foto.jpg?width=200&quality=75
```

Fark: `/object/public/` → `/render/image/public/` + query parametreleri

---

## GÖREV: Helper fonksiyon oluştur ve tüm img src'lerinde kullan

### Adım 1: Helper fonksiyon — src/lib/imageUtils.ts (YENİ DOSYA)

```typescript
/**
 * Supabase Storage image URL'ini optimize edilmiş versiyona dönüştürür.
 * /object/public/ → /render/image/public/ + width & quality parametreleri ekler.
 * 
 * Sadece Supabase Storage URL'leri dönüştürülür, harici URL'ler aynen döner.
 */

const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';
const STORAGE_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

export type ImageSize = 'thumbnail' | 'card' | 'detail' | 'cover' | 'original';

const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number }> = {
  thumbnail: { width: 80, quality: 60 },    // Kategori fotoğrafları, küçük ikonlar
  card: { width: 200, quality: 70 },         // Ürün kartları (48x48, 56x56 gösterim)
  detail: { width: 480, quality: 80 },       // Ürün detay modalı (büyük fotoğraf)
  cover: { width: 800, quality: 75 },        // Kapak görseli, splash
  original: { width: 0, quality: 100 },      // Orijinal boyut (admin yükleme önizleme)
};

export function getOptimizedImageUrl(
  url: string | null | undefined,
  size: ImageSize = 'card'
): string {
  if (!url) return '';
  
  // Sadece Supabase Storage URL'lerini dönüştür
  if (!url.includes(SUPABASE_URL) || !url.includes(STORAGE_PATH)) {
    return url;
  }
  
  // Original boyut isteniyorsa dönüştürme yapma
  if (size === 'original') return url;
  
  const config = SIZE_CONFIG[size];
  
  // /object/public/ → /render/image/public/
  const renderUrl = url.replace(STORAGE_PATH, RENDER_PATH);
  
  // Query parametreleri ekle
  const separator = renderUrl.includes('?') ? '&' : '?';
  return `${renderUrl}${separator}width=${config.width}&quality=${config.quality}`;
}
```

### Adım 2: PublicMenu.tsx — Tüm img src'leri güncelle

Dosyada `image_url`, `logo_url`, `cover_url` kullanan tüm `<img>` tag'leri bul ve `getOptimizedImageUrl()` ile sar:

```typescript
import { getOptimizedImageUrl } from '../lib/imageUtils';
```

#### Ürün kartları (liste/grid görünümü):
```tsx
// ÖNCE (orijinal boyut yükleniyor):
<img src={item.image_url} ... />

// SONRA (200px küçültülmüş):
<img src={getOptimizedImageUrl(item.image_url, 'card')} ... />
```

#### Featured ürünler (2x büyük kart):
```tsx
// Featured kart büyük olduğu için 'detail' boyutu kullan
<img src={getOptimizedImageUrl(item.image_url, 'detail')} ... />
```

#### Ürün detay modalı (büyük fotoğraf):
```tsx
<img src={getOptimizedImageUrl(item.image_url, 'detail')} ... />
```

#### Kategori fotoğrafları (tab bar'daki küçük thumbnail'ler):
```tsx
<img src={getOptimizedImageUrl(cat.image_url, 'thumbnail')} ... />
```

#### Splash ekranı kapak görseli:
```tsx
<img src={getOptimizedImageUrl(restaurant.cover_url, 'cover')} ... />
```

#### Restoran logosu (splash + header):
```tsx
// Logo genelde küçük gösterilir
<img src={getOptimizedImageUrl(restaurant.logo_url, 'thumbnail')} ... />
```

### Adım 3: RestaurantDashboard.tsx — Admin panel fotoğrafları

Admin panelde de aynı optimizasyonu uygula (admin de hız kazanır):

#### Ürün listesi thumbnail'leri (48x48):
```tsx
<img src={getOptimizedImageUrl(item.image_url, 'card')} ... />
```

#### Kategori fotoğrafları (40x40):
```tsx
<img src={getOptimizedImageUrl(cat.image_url, 'thumbnail')} ... />
```

#### Ürün düzenleme formundaki önizleme (64x64):
```tsx
// Formda küçük önizleme — card boyutu yeterli
<img src={getOptimizedImageUrl(item.image_url, 'card')} ... />
```

#### Profil tab — logo ve kapak:
```tsx
// Admin'de logo/cover önizleme — card veya detail
<img src={getOptimizedImageUrl(restaurant.logo_url, 'card')} ... />
<img src={getOptimizedImageUrl(restaurant.cover_url, 'detail')} ... />
```

---

## BOYUT REFERANSI

| Size | width | quality | Kullanım Yeri | Tahmini Boyut |
|------|-------|---------|---------------|---------------|
| thumbnail | 80px | 60% | Kategori ikonları, logo | ~5-15KB |
| card | 200px | 70% | Ürün kartları, admin liste | ~15-40KB |
| detail | 480px | 80% | Detay modal, featured kart | ~40-80KB |
| cover | 800px | 75% | Splash kapak görseli | ~60-120KB |
| original | - | 100% | Upload önizleme | Orijinal |

Orijinal 1-3MB fotoğraflar → card boyutunda ~20KB'ye düşer. 76 ürünlük menüde:
- Önce: 76 × ~1MB = ~76MB potansiyel
- Sonra: 76 × ~20KB = ~1.5MB (loading="lazy" ile sadece görünen olanlar yüklenir)

---

## ÖNEMLİ NOTLAR

1. **Supabase Pro plan gerekli** — Image Transforms Pro plan'da aktif. Tabbled zaten Pro plan'da olmalı.
2. **İlk istek yavaş olabilir** — Transform ilk kez yapılınca biraz sürer, sonraki istekler CDN cache'den gelir.
3. **Orijinal dosyalara dokunma** — Helper sadece URL'i değiştirir, orijinal dosya Storage'da olduğu gibi kalır.
4. **Harici URL'ler etkilenmez** — getOptimizedImageUrl() sadece Supabase URL'lerini dönüştürür.
5. **Otomatik WebP** — Chrome/Edge/Firefox'ta Supabase otomatik olarak WebP döner, ek bir şey yapmaya gerek yok.

---

## KONTROL LİSTESİ

- [ ] src/lib/imageUtils.ts oluşturuldu
- [ ] PublicMenu.tsx — tüm img src'leri getOptimizedImageUrl() ile sarıldı
- [ ] RestaurantDashboard.tsx — ürün ve kategori thumbnail'leri optimize edildi
- [ ] Splash kapak görseli 'cover' boyutunda
- [ ] Ürün detay modalı 'detail' boyutunda
- [ ] Kategori fotoğrafları 'thumbnail' boyutunda
- [ ] Ürün kartları 'card' boyutunda
- [ ] Logo 'thumbnail' boyutunda
- [ ] Harici URL'ler (Supabase dışı) etkilenmiyor
- [ ] npm run build başarılı
- [ ] npx tsc --noEmit başarılı

---

## DOKUNULMAYACAKLAR

- Fotoğraf yükleme kodu (upload sırasında resize YAPMA — Supabase runtime'da yapıyor)
- SuperAdminDashboard.tsx (fotoğraf göstermiyor)
- Landing page (hero image zaten WebP optimize)
- public/allergens/ SVG dosyaları (bunlar zaten küçük)
- Edge function'lar
