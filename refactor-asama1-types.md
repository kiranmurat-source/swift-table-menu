# Refactor Aşama 1/4 — Types & Interfaces Ayırma

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com). `src/pages/PublicMenu.tsx` dosyası 3459 satır — teknik borç ödemesi için kademeli refactor yapıyoruz. Bu Aşama 1.

**Strateji:** Güvenli, kendi içinde bağımsız parçaları ayrı dosyalara taşıyoruz. Ana `PublicMenu` component'ine, `MenuItemCard`'a ve `ItemDetailModal`'a KESİNLİKLE dokunmuyoruz — bunlar sıkı state bağımlılığı olan dev fonksiyonlar.

## AŞAMA 1 GÖREVİ

PublicMenu.tsx'te tanımlanmış tipleri/interface'leri yeni bir `src/types/menu.ts` dosyasına taşı ve PublicMenu.tsx'te import et.

## TAŞINACAK TİPLER

PublicMenu.tsx'ten aşağıdaki tip/interface tanımlarını bul ve al. Satır numaraları referans:

**Satır 49-50:**
```typescript
type LangCode = string;
type UiLangCode = 'tr' | 'en' | 'ar' | 'zh';
```

**Satır 59:** `interface Translations { ... }` — tam bloğu al (kapanış parantezine kadar)

**Satır 63:** `interface Restaurant { ... }` — tam bloğu al

**Satır 89:** `interface MenuCategory { ... }` — tam bloğu al

**Satır 97-98:**
```typescript
interface PeriodicDayVal { enabled?: boolean; start?: string; end?: string; all_day?: boolean }
type PeriodicScheduleVal = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDayVal>>;
```

**Satır 100:** `interface PriceVariant { ... }` — tam bloğu al

**Satır 107:** `interface Nutrition { ... }` — tam bloğu al

**Satır 127:** `interface MenuItem { ... }` — tam bloğu al

**Satır 2574:**
```typescript
type RecRow = { recommended_item_id: string; reason_tr: string | null; reason_en: string | null; sort_order: number };
```

## ADIM 1: YENİ DOSYA OLUŞTUR

`src/types/menu.ts` dosyasını oluştur:

```typescript
// src/types/menu.ts
// Tabbled public menu type definitions
// PublicMenu.tsx'ten çıkarıldı — tüm tip tanımları merkezi yer

export type LangCode = string;
export type UiLangCode = 'tr' | 'en' | 'ar' | 'zh';

// (PublicMenu.tsx'teki Translations interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface Translations { /* mevcut içerik */ }

// (PublicMenu.tsx'teki Restaurant interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface Restaurant { /* mevcut içerik */ }

// (PublicMenu.tsx'teki MenuCategory interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface MenuCategory { /* mevcut içerik */ }

export interface PeriodicDayVal { enabled?: boolean; start?: string; end?: string; all_day?: boolean }
export type PeriodicScheduleVal = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDayVal>>;

// (PublicMenu.tsx'teki PriceVariant interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface PriceVariant { /* mevcut içerik */ }

// (PublicMenu.tsx'teki Nutrition interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface Nutrition { /* mevcut içerik */ }

// (PublicMenu.tsx'teki MenuItem interface'ini AYNEN buraya taşı, başına "export" ekle)
export interface MenuItem { /* mevcut içerik */ }

// (PublicMenu.tsx'teki RecRow type'ını AYNEN buraya taşı, başına "export" ekle)
export type RecRow = { recommended_item_id: string; reason_tr: string | null; reason_en: string | null; sort_order: number };
```

**ÖNEMLİ:** Tiplerin iç içeriğini DEĞİŞTİRMEDEN, birebir kopyala. Her tipin başına `export` ekle.

## ADIM 2: PUBLICMENU.TSX'TEN TİPLERİ SİL

Satır 49'dan MenuItem interface'inin kapanışına kadar olan tüm tip tanımlarını sil (Satır 49 → yaklaşık satır 150 civarı). 

Ve satır 2574'teki `RecRow` tanımını sil.

**DİKKAT:**
- Satır 54'teki `function toUiLang` fonksiyonuna DOKUNMA — bu tip değil, utility fonksiyon (Aşama 2'de taşınacak)
- Satır 152'deki `function hasVariants` ve sonrasına DOKUNMA — bunlar Aşama 2 için

## ADIM 3: IMPORT EKLE

PublicMenu.tsx'in en üstüne, mevcut import'ların uygun bir yerine (Supabase import'ından sonra veya başka bir mantıklı konuma):

```typescript
import type {
  LangCode,
  UiLangCode,
  Translations,
  Restaurant,
  MenuCategory,
  PeriodicDayVal,
  PeriodicScheduleVal,
  PriceVariant,
  Nutrition,
  MenuItem,
  RecRow,
} from '../types/menu';
```

## ADIM 4: DİĞER DOSYALARDA KULLANIM KONTROLÜ

Bu tipleri başka dosyalar import ediyor olabilir. Kontrol et:

```bash
grep -rn "from '../pages/PublicMenu'" src/ --include="*.tsx" --include="*.ts"
grep -rn "from './PublicMenu'" src/ --include="*.tsx" --include="*.ts"
```

Eğer başka dosyalarda PublicMenu'dan tip import varsa, onları da `../types/menu` kaynağına yönlendir.

## GENEL KURALLAR

1. **Tip iç yapılarına DOKUNMA** — sadece taşı, yeniden yazma
2. **Ana PublicMenu component'ine dokunma** — sadece başındaki tip tanımlarını sil ve import ekle
3. **Başka hiçbir dosyaya dokunma** (utility fonksiyonlar, bileşenler — hepsi Aşama 2+ işi)
4. **Import sırası:** TypeScript `import type` kullan, runtime import değil
5. **PublicMenu.tsx içinde** `toUiLang`, `hasVariants`, `MenuItemCard`, `ItemDetailModal`, vs. AYNEN KALACAK — sadece tip bloklarını siliyoruz

## TEST CHECKLIST

1. `src/types/menu.ts` dosyası oluşturuldu, 10+ tip/interface export ediliyor
2. PublicMenu.tsx'te tip tanımları silindi (~100 satır azaldı)
3. PublicMenu.tsx'te `import type { ... } from '../types/menu'` satırı var
4. `npm run build` çalıştır — TypeScript hatası olmamalı
5. Build başarılıysa commit + push:
   ```bash
   git add src/pages/PublicMenu.tsx src/types/menu.ts
   git commit -m "refactor(1/4): Extract types to src/types/menu.ts"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```
6. Vercel deploy bekle (1-2 dk)
7. Production test: https://tabbled.com/menu/ramada-encore-bayrampasa
   - Menü yükleniyor mu ✅
   - Kategoriler gözüküyor mu ✅
   - Ürün kartları açılıyor mu ✅
   - Detay modal çalışıyor mu ✅
   - Nutri-Score strip doğru mu ✅

## BAŞARI KRİTERLERİ

- ✅ `src/types/menu.ts` oluşturuldu ve tüm tipleri export ediyor
- ✅ PublicMenu.tsx'te tip tanımları yok (sadece import var)
- ✅ PublicMenu.tsx satır sayısı ~3360'a düştü (3459'dan ~100 satır az)
- ✅ `npm run build` hatasız
- ✅ Production'da menü normal çalışıyor

## HATA DURUMU

Eğer TypeScript bir tipte hata verirse (örn. "Cannot find name 'MenuItem'"), muhtemelen:
- Bir tipi taşırken başka bir tipe referans veriyordur (örn. MenuItem → PriceVariant)
- Tüm bağımlı tipler aynı dosyaya taşındığı için sorun olmamalı
- Ama yine de build hatası çıkarsa, eksik kalan tipi dikkatle kontrol et

Başka bir hata çıkarsa TAMAMEN DURDUR, raporla, düzeltme için yeni bir prompt beklenir.

## ÖNCELİK SIRASI

1. src/types/menu.ts oluştur (tüm tipler export'lu)
2. PublicMenu.tsx'ten tip tanımlarını sil
3. PublicMenu.tsx'e import type ekle
4. Başka dosyalarda PublicMenu'dan tip import'u varsa yönlendir
5. Build → commit → push
6. Aşama 1 bitir — Aşama 2 için ayrı prompt gelecek
