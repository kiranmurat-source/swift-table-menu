# TABBLED.COM — CLAUDE CODE PROMPT
## Kod Audit + Dead Code Temizliği + Teknik Borç

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **DB:** Supabase PostgreSQL (qmnrawqvkwehufebbkxp.supabase.co)
- **Style:** S.* inline styles kullanılıyor
- **İkon:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide'a DOKUNMA

---

## BAĞLAM: SON 7 GÜNDE YAPILAN BÜYÜK DEĞİŞİKLİKLER

Bu audit'in sebebi: 5-12 Nisan arasında çok hızlı ve büyük refactoring'ler yapıldı. Dead code birikmiş olabilir.

**Ana değişiklikler:**
1. Modal → Inline akordeon form (ürün düzenleme modal'ı tamamen kaldırıldı)
2. Çoklu fiyat varyantları (price_variants JSONB eklendi)
3. Hazırlanma süresi (prep_time eklendi)
4. Besin değerleri tablosu (nutrition JSONB eklendi)
5. Kategori değiştirme (ürün formuna dropdown eklendi)
6. Alt kategori drag handle

---

## GÖREV 1: DEAD CODE TEMİZLİĞİ

### Talimatlar:
Aşağıdaki dosyaları tara ve kullanılmayan kodu temizle. **Dikkatli ol — çalışan kodu silme.** Her silme işleminden önce referans kontrolü yap (grep/search).

### A) RestaurantDashboard.tsx — Bilinen Dead Code Adayları:

1. **Eski modal state'leri:** `showItemModal`, `showItemForm`, `isModalOpen` veya benzer modal açma/kapama state'leri varsa kaldır. Modal tamamen inline akordeon form ile değiştirildi.

2. **`itemForm.calories` draft field:** Claude Code'un bildirimi: "itemForm.calories draft field'ı artık ölü — sadece generate-description edge function'ına pass ediliyor." Kontrol et:
   - `itemForm.calories` state'i kullanılıyor mu?
   - Eğer sadece AI description generation'a gidiyorsa → `itemForm.nutrition?.calories` ile değiştir
   - Eğer başka yerde kullanılmıyorsa → formdan kaldır
   - DİKKAT: `emptyItemForm` içinde de temizle

3. **Kullanılmayan import'lar:** Her dosyanın başındaki import satırlarını kontrol et. Kullanılmayan Circum Icon import'ları, kullanılmayan React hook'ları, kullanılmayan helper fonksiyonları kaldır.

4. **Eski modal render kodu:** Modal overlay, backdrop, modal container JSX'i tamamen kaldırılmış mı? IIFE sarmalama (hoisted renderItemForm closure) hala varsa ve artık gereksizse temizle.

5. **Çift tanımlı tipler:** `MenuItem`, `PriceVariant` gibi tipler hem RestaurantDashboard hem PublicMenu'de tanımlı olabilir. Ortak tipleri `src/types/` veya `src/lib/types.ts` dosyasına taşımak opsiyonel ama not et.

### B) PublicMenu.tsx — Bilinen Dead Code Adayları:

1. **Standalone kalori satırı duplikasyonu:** Besin tablosu gösterilirken eski kalori satırı gizleniyor mu kontrol et (son commit'te yapıldığı bildirildi ama doğrula).

2. **Kullanılmayan import'lar ve helper'lar**

3. **800+ satırlık inline UI strings:** Bu şu an çalışıyor, DOKUNMA. Sadece not et ki ileride `languages.ts`'e taşınabilir.

### C) Diğer Dosyalar:

4. **src/lib/languages.ts:** Kullanılmayan dil key'leri var mı?
5. **src/lib/allergens.ts:** Kullanılmayan allerjen tanımları var mı?
6. **src/lib/themes.ts:** Kullanılmayan tema property'leri var mı?
7. **src/lib/imageUtils.ts:** Kullanılmayan fonksiyonlar var mı?
8. **src/components/:** Kullanılmayan bileşen dosyaları var mı? (import edilmeyen .tsx dosyaları)

### D) Genel Tarama:

9. **`console.log` taraması:** Tüm kaynak dosyalarda `console.log` ara. Development-only log'ları `import.meta.env.DEV` gate'i ile sar veya kaldır.
   ```typescript
   // ÖNCE:
   console.log('[Tabbled] Restaurant loaded in', elapsed, 'ms');
   
   // SONRA:
   if (import.meta.env.DEV) console.log('[Tabbled] Restaurant loaded in', elapsed, 'ms');
   ```

10. **`console.error` ve `console.warn`:** Bunlar KALSIN — hata logları önemli. Sadece `console.log` temizle.

11. **Commented-out code:** Yorum satırı haline getirilmiş eski kod blokları varsa sil. Git history'de zaten var.

---

## GÖREV 2: TEKNİK BORÇ — SUPABASE_URL HARDCODED FIX

### Sorun:
`src/lib/imageUtils.ts` içinde Supabase URL hardcoded olarak yazılmış. `supabase.ts`'den import edilmeli.

### Çözüm:
```typescript
// imageUtils.ts — ÖNCE:
const SUPABASE_URL = 'https://qmnrawqvkwehufebbkxp.supabase.co';

// imageUtils.ts — SONRA:
import { supabase } from './supabase';
const SUPABASE_URL = supabase.supabaseUrl || 'https://qmnrawqvkwehufebbkxp.supabase.co';
// VEYA supabase client'ın URL'sini çekmenin doğru yolu ne ise onu kullan
// Fallback hardcoded değer güvenlik ağı olarak kalabilir
```

DİKKAT: `supabase.ts`'deki client nasıl oluşturulmuş kontrol et. `supabaseUrl` property'si yoksa, environment variable kullan:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qmnrawqvkwehufebbkxp.supabase.co';
```

---

## GÖREV 3: TEKNİK BORÇ — IMAGE onError FALLBACK

### Sorun:
Supabase Image Transforms Pro plan gerektiriyor. Plan düşerse veya görseller kırılırsa, tüm optimize edilmiş URL'ler 404 döner.

### Çözüm:
Tüm `<img>` tag'lerine onError fallback ekle:

```typescript
// Helper fonksiyon (imageUtils.ts'e ekle):
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const src = img.src;
  
  // Eğer zaten optimize URL'deyse, orijinal URL'e fallback yap
  if (src.includes('/render/image/')) {
    // /render/image/public/ → /object/public/ dönüşümü
    img.src = src.replace('/render/image/', '/object/');
    // Query parametrelerini kaldır (width, quality vb.)
    img.src = img.src.split('?')[0];
  } else {
    // Tamamen kırık görsel — placeholder göster
    img.src = '/placeholder-food.svg'; // veya Circum Icons fallback
    img.style.objectFit = 'contain';
    img.style.padding = '16px';
    img.style.opacity = '0.3';
  }
};
```

**Uygulanacak yerler:**
- `PublicMenu.tsx` — tüm ürün fotoğrafları (kart + featured + detay modal)
- `RestaurantDashboard.tsx` — ürün satırı thumbnails, kategori fotoğrafları
- Splash ekran cover görseli
- Restoran logosu

**Placeholder SVG:** `/public/placeholder-food.svg` oluştur — basit bir fork+knife veya tabak ikonu, gri tonlarda, 200x200px.

---

## GÖREV 4: TEKNİK BORÇ — CONSOLE.LOG PRODUCTION GATE

Bu zaten Görev 1 D.9'da ele alındı ama ayrı teknik borç item'ı olarak da not edildiği için burada tekrar vurguluyorum.

**Kural:** Tüm `console.log` satırları `import.meta.env.DEV` ile sarılacak. `console.error` ve `console.warn` dokunulmayacak.

---

## GÖREV 5: BUNDLE ANALİZİ (SADECE RAPOR)

Bu görevde değişiklik YAPMA — sadece rapor et:

1. `npm run build` çalıştır
2. Çıktıdaki chunk boyutlarını not et
3. En büyük 5 chunk'ı listele
4. Vendor chunk'ların boyutlarını kontrol et
5. Önceki referans: ana chunk 246KB (gzip 77KB)
6. Değişimi rapor et

---

## YAPILMAYACAKLAR (DOKUNMA)

1. **PublicMenu.tsx UI strings objesi** — 800+ satır inline, çalışıyor, taşıma bu task'ın dışında
2. **Çeviri merkezi parent→child tree** — ayrı task
3. **Dinamik sitemap** — ayrı task (Edge Function gerektirir)
4. **Google Translate API key restrict** — manuel yapılacak (Google Cloud Console)
5. **Tip birleştirme** (MenuItem vb. ortak dosyaya taşıma) — opsiyonel, zorunlu değil, riski var

---

## GENEL KURALLAR

1. **Silmeden önce grep yap:** Her fonksiyon/state/import'ı silmeden önce tüm projede `grep -r "fonksiyon_adi" src/` ile kontrol et
2. **Çalışan kodu bozma:** Emin olmadığın dead code'u silme, yorum olarak işaretle `// DEAD CODE?` ile
3. **Test:** Her silme grubundan sonra `npm run build` çalıştır — type error çıkarsa geri al
4. **İkon:** Circum Icons'a DOKUNMA. shadcn/ui internal Lucide'a DOKUNMA.
5. **Deployment:** `npm run build` test → `git add -A && git commit -m "Audit: Dead code temizliği + teknik borç (imageUtils, console.log, onError fallback)" && git push origin main`

---

## TEST CHECKLIST

### Dead Code:
- [ ] Kullanılmayan import'lar kaldırıldı
- [ ] Eski modal state/render kodu kaldırıldı (varsa)
- [ ] itemForm.calories dead field temizlendi (veya rewire edildi)
- [ ] Commented-out code blokları silindi
- [ ] `npm run build` hata vermeden geçiyor

### Teknik Borç:
- [ ] imageUtils.ts — SUPABASE_URL env variable'dan okunuyor
- [ ] Image onError — kırık görselde fallback çalışıyor (placeholder veya orijinal URL)
- [ ] console.log — production'da gizleniyor (import.meta.env.DEV gate)
- [ ] Placeholder SVG dosyası oluşturuldu (/public/placeholder-food.svg)

### Regression:
- [ ] Admin panel çalışıyor (inline form, kategoriler, ürünler)
- [ ] Public menü çalışıyor (kartlar, detay modal, splash)
- [ ] Super admin panel çalışıyor
- [ ] Landing page çalışıyor
- [ ] Login çalışıyor

### Bundle:
- [ ] Bundle boyutu rapor edildi
- [ ] Büyük bir artış yoksa OK

---

## ÖNCELİK SIRASI

1. `npm run build` — başlangıç durumunu kaydet
2. Dead code taraması + temizlik (RestaurantDashboard → PublicMenu → diğerleri)
3. Her temizlik grubundan sonra build testi
4. console.log gate'leme
5. imageUtils.ts SUPABASE_URL fix
6. Image onError fallback + placeholder SVG
7. Final build + bundle raporu
8. Commit + push
