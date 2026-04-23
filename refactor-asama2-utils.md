# Refactor Aşama 2/4 — Utility Fonksiyonları Ayırma

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com). `src/pages/PublicMenu.tsx` dosyası şu an 3370 satır (Aşama 1'den sonra). Kademeli refactor devam ediyor — Aşama 1 types dosyasını oluşturdu, bu Aşama 2.

**Strateji:** Pure utility fonksiyonlarını (state'siz, React'tan bağımsız) ayrı bir helper dosyasına taşıyoruz. Ana `PublicMenu` component'ine, `MenuItemCard`'a ve `ItemDetailModal`'a KESİNLİKLE dokunmuyoruz.

**Aşama 1'de yapılan:** Tüm tipler `src/types/menu.ts`'e taşındı, PublicMenu.tsx'te `import type` ile kullanılıyor.

## AŞAMA 2 GÖREVİ

PublicMenu.tsx'te tanımlanmış pure utility fonksiyonlarını yeni bir `src/lib/menuHelpers.ts` dosyasına taşı ve PublicMenu.tsx'te import et.

## TAŞINACAK FONKSİYONLAR

PublicMenu.tsx'ten aşağıdaki fonksiyonları bul ve al. Satır numaraları Aşama 1 öncesinin referansına göre — dosya -89 satır olduğu için şu an gerçek konumları biraz yukarıda olabilir. Grep ile bul:

```bash
grep -n "^function toUiLang\|^function hasVariants\|^function minVariantPrice\|^function formatPriceDisplay\|^function variantDisplayName\|^function isItemVisibleBySchedule\|^function isHappyHourActive\|^function parseVideoEmbed" src/pages/PublicMenu.tsx
```

**Taşınacak 8 fonksiyon:**

1. `function toUiLang(lang: string): UiLangCode` — eski satır ~54
2. `function hasVariants(item: MenuItem): boolean` — eski satır ~152
3. `function minVariantPrice(item: MenuItem): number` — eski satır ~156
4. `function formatPriceDisplay(item: MenuItem, uiLang: UiLangCode, format: (n: number) => string): string` — eski satır ~161
5. `function variantDisplayName(v: PriceVariant, lang: LangCode): string` — eski satır ~170
6. `function isItemVisibleBySchedule(item: MenuItem, now: Date = new Date()): boolean` — eski satır ~177
7. `function isHappyHourActive(item: MenuItem): boolean` — eski satır ~199
8. `function parseVideoEmbed(url: string | null | undefined): { type: 'youtube' | 'vimeo' | 'direct'; src: string } | null` — eski satır ~2564

## ÖNEMLİ: `t()` FONKSİYONU TAŞINMIYOR

Eski satır ~235'teki `function t(...)` translation fonksiyonu **TAŞINMIYOR** çünkü:
- Büyük olasılıkla UI dictionary (UI object) gibi dosya kapsamındaki state'e bağımlı olabilir
- Ana component'in translate davranışıyla sıkı ilişkili
- Bu aşamada risk almak istemiyoruz

`t()` fonksiyonuna DOKUNMA, PublicMenu.tsx'te kalacak.

## ADIM 1: YENİ DOSYA OLUŞTUR

`src/lib/menuHelpers.ts` dosyasını oluştur:

```typescript
// src/lib/menuHelpers.ts
// Pure utility functions for public menu display
// PublicMenu.tsx'ten çıkarıldı — state'siz, React'tan bağımsız helpers

import type { LangCode, UiLangCode, MenuItem, PriceVariant } from '../types/menu';

// (PublicMenu.tsx'teki toUiLang fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function toUiLang(lang: string): UiLangCode {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki hasVariants fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function hasVariants(item: MenuItem): boolean {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki minVariantPrice fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function minVariantPrice(item: MenuItem): number {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki formatPriceDisplay fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function formatPriceDisplay(item: MenuItem, uiLang: UiLangCode, format: (n: number) => string): string {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki variantDisplayName fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function variantDisplayName(v: PriceVariant, lang: LangCode): string {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki isItemVisibleBySchedule fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function isItemVisibleBySchedule(item: MenuItem, now: Date = new Date()): boolean {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki isHappyHourActive fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function isHappyHourActive(item: MenuItem): boolean {
  /* mevcut içerik aynen */
}

// (PublicMenu.tsx'teki parseVideoEmbed fonksiyonunun TAM GÖVDESİNİ AYNEN buraya taşı, başına "export" ekle)
export function parseVideoEmbed(url: string | null | undefined): { type: 'youtube' | 'vimeo' | 'direct'; src: string } | null {
  /* mevcut içerik aynen */
}
```

**ÖNEMLİ:** Fonksiyonların iç mantığını DEĞİŞTİRMEDEN, birebir kopyala. Her fonksiyonun başına `export` ekle.

## ADIM 2: PUBLICMENU.TSX'TEN FONKSİYONLARI SİL

Yukarıdaki 8 fonksiyonun tüm gövdelerini (her birinin başından kapanış `}` parantezine kadar) PublicMenu.tsx'ten sil.

**DİKKAT — DOKUNULMAYACAKLAR:**
- `function t(...)` — translation fonksiyonu, AYNEN KALACAK
- `SocialIcon` const bileşeni — React component, AYNEN KALACAK
- `FilterPanel`, `BentoCategoryCard`, `MenuItemCard`, `ItemDetailModal`, `NutritionFactsTable`, `NutriScoreBadge`, `NutriScoreStrip` — hepsi AYNEN KALACAK
- Ana `PublicMenu` component'i — AYNEN KALACAK

## ADIM 3: IMPORT EKLE

PublicMenu.tsx'in import bloğuna yeni bir satır ekle (diğer '../lib/' import'larının yanına):

```typescript
import {
  toUiLang,
  hasVariants,
  minVariantPrice,
  formatPriceDisplay,
  variantDisplayName,
  isItemVisibleBySchedule,
  isHappyHourActive,
  parseVideoEmbed,
} from '../lib/menuHelpers';
```

## ADIM 4: DİĞER DOSYALARDA KULLANIM KONTROLÜ

Bu utility fonksiyonlarını başka dosyalar da kullanıyor olabilir. Kontrol et:

```bash
grep -rn "hasVariants\|minVariantPrice\|formatPriceDisplay\|variantDisplayName\|isItemVisibleBySchedule\|isHappyHourActive\|parseVideoEmbed\|toUiLang" src/ --include="*.tsx" --include="*.ts" | grep -v "PublicMenu.tsx\|menuHelpers.ts"
```

Eğer başka dosyalarda kullanım varsa (örn. components/ klasörü, hooks/ klasörü), o dosyalara da `import { ... } from '../lib/menuHelpers'` satırı ekle.

## GENEL KURALLAR

1. **Fonksiyon iç mantığına DOKUNMA** — sadece taşı, yeniden yazma, optimize etme
2. **`t()` translation fonksiyonuna DOKUNMA** — PublicMenu.tsx'te kalıyor
3. **Ana PublicMenu component'ine dokunma** — sadece fonksiyon tanımlarını sil ve import ekle
4. **Bileşenlere dokunma** — MenuItemCard, ItemDetailModal, vs. Aşama 3 ve 4'te taşınacak
5. **Tipleri tekrar import etme** — zaten Aşama 1'de taşındılar, menuHelpers.ts de `../types/menu`'den alır

## TEST CHECKLIST

1. `src/lib/menuHelpers.ts` dosyası oluşturuldu, 8 fonksiyon export ediliyor
2. PublicMenu.tsx'te bu 8 fonksiyon tanımı silindi (~150 satır azaldı)
3. PublicMenu.tsx'te `import { ... } from '../lib/menuHelpers'` satırı var
4. Başka dosyalarda kullanım varsa yönlendirildi
5. `npm run build` çalıştır — TypeScript hatası olmamalı
6. Build başarılıysa commit + push:
   ```bash
   git add src/pages/PublicMenu.tsx src/lib/menuHelpers.ts
   # Eğer başka dosyalar da değiştiyse onları da ekle
   git add <diğer dosyalar varsa>
   git commit -m "refactor(2/4): Extract utility functions to src/lib/menuHelpers.ts"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```
7. Vercel deploy bekle (1-2 dk)
8. Production test: https://tabbled.com/menu/ramada-encore-bayrampasa
   - Menü yükleniyor ✅
   - Ürün kartları, fiyatlar, varyantlar doğru ✅
   - Happy hour fiyatları çalışıyor ✅
   - Zamanlı menü (breakfast/lunch/dinner) filtreleme çalışıyor ✅
   - Video embed (varsa) çalışıyor ✅
   - Detay modal açılıyor ve Nutri-Score strip doğru ✅

## BAŞARI KRİTERLERİ

- ✅ `src/lib/menuHelpers.ts` oluşturuldu ve 8 fonksiyonu export ediyor
- ✅ PublicMenu.tsx'te bu 8 fonksiyon tanımı yok
- ✅ PublicMenu.tsx satır sayısı ~3220'ye düştü (3370'den ~150 satır az)
- ✅ `npm run build` hatasız
- ✅ Production'da menü normal çalışıyor, tüm fonksiyonlar doğru davranıyor

## HATA DURUMU

Eğer TypeScript "Cannot find name 'X'" gibi bir hata verirse, muhtemelen başka bir dosya da (components/, hooks/) bu fonksiyonları kullanıyor ve import eklemedin. Hata mesajındaki dosyayı kontrol et, oraya da import ekle.

Başka bir hata çıkarsa TAMAMEN DURDUR, raporla, düzeltme için yeni prompt beklenir.

## ÖNCELİK SIRASI

1. src/lib/menuHelpers.ts oluştur (8 fonksiyon export'lu)
2. PublicMenu.tsx'ten fonksiyon tanımlarını sil
3. PublicMenu.tsx'e import ekle
4. Başka dosyalarda kullanım varsa yönlendir
5. Build → commit → push
6. Aşama 2 bitir — Aşama 3 için ayrı prompt gelecek
