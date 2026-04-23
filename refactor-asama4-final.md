# Refactor Aşama 4/4 — Son Bileşenleri Ayırma (FilterPanel + BentoCategoryCard + NutritionFactsTable)

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com). `src/pages/PublicMenu.tsx` dosyası şu an 3042 satır (Aşama 1+2+3 sonrası). Bu refactor dizisinin SON aşaması.

**Önceki aşamalarda yapılanlar:**
- Aşama 1: Types → `src/types/menu.ts`
- Aşama 2: Utilities → `src/lib/menuHelpers.ts`
- Aşama 3: NutriScore bileşenleri → `src/components/menu/NutriScoreBadge.tsx`, `NutriScoreStrip.tsx`

**Bu aşamada:** 3 self-contained bileşen ayrı dosyalara taşınacak.

## AŞAMA 4 GÖREVİ — 3 BİLEŞEN

Aşağıdaki 3 bileşeni sırayla kendi dosyalarına taşı:

1. **`FilterPanel`** → `src/components/menu/FilterPanel.tsx` (satır 1725-~1879)
2. **`BentoCategoryCard`** → `src/components/menu/BentoCategoryCard.tsx` (satır 1880-~2031)
3. **`NutritionFactsTable`** → `src/components/menu/NutritionFactsTable.tsx` (satır 2890-dosya sonu)

Her biri bağımsız, sırayla yap. **Birinde hata olursa DURDUR ve raporla** — diğerine geçme.

## ÖNEMLİ — DOKUNULMAYACAK BİLEŞENLER

Bu bileşenler PublicMenu.tsx'te KALACAK, taşınmayacak:
- `SocialIcon` (satır 258) — küçük yardımcı, bir sonraki session'da değerlendirilecek
- `MenuItemCard` (satır 2032) — state bağımlılığı yüksek, refactor için risk
- `ItemDetailModal` (satır 2407) — kompleks, refactor için risk
- Ana `PublicMenu` component'i
- `function t(...)` translation fonksiyonu

## ADIM 0: GÜNCEL SATIR NUMARALARINI DOĞRULA

İlk önce güncel satır numaralarını teyit et:

```bash
grep -n "^function FilterPanel\|^function BentoCategoryCard\|^function MenuItemCard\|^function NutritionFactsTable" src/pages/PublicMenu.tsx
```

Her bileşenin başlangıç satırını bu çıktıdan al. Her bir bileşenin BİTİŞ satırı, bir sonraki bileşenin BAŞLANGIÇ satırından bir önceki satırdır (veya dosya sonu).

---

## ADIM 1: FilterPanel.tsx OLUŞTUR

### Dosya: `src/components/menu/FilterPanel.tsx`

PublicMenu.tsx'te `function FilterPanel({ ... }) { ... }` bloğunu AYNEN bul.

Yeni dosyanın şablonu:

```typescript
// src/components/menu/FilterPanel.tsx
// Filter drawer bileşeni — kategori/diyet/alerjen filtreleme
// PublicMenu.tsx'ten çıkarıldı

import { /* hangi React hook'lar kullanılıyorsa: useState, useEffect, useMemo, vs. */ } from 'react';
import type { LangCode, MenuCategory, MenuItem } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';
// Diğer gerekli import'lar (Phosphor ikonlar, ALLERGEN_LIST, DIET_LIST, getAllergenInfo, vs.)
// FilterPanel'ın body'sine bakarak gerekli import'ları tespit et

export function FilterPanel({
  /* mevcut prop'lar AYNEN */
}: {
  /* mevcut type definitions AYNEN */
}) {
  // PublicMenu.tsx'teki FilterPanel fonksiyonunun İÇ GÖVDESİNİ AYNEN buraya taşı.
  // JSX, style, state logic — hiçbir şeyi değiştirme.
}
```

### Import'ları DİKKATLE belirle

FilterPanel'ın body'sini tara, şunları kullanıyor olabilir:
- React hook'ları: `useState`, `useEffect`, vs.
- Types: `LangCode`, `MenuCategory`, `MenuItem` → `../../types/menu`
- `MenuTheme` → `../../lib/themes`
- `toUiLang` → `../../lib/menuHelpers`
- Phosphor ikonları → `@phosphor-icons/react`
- `ALLERGEN_LIST`, `DIET_LIST`, `getAllergenInfo` → `../../lib/allergens`
- UI sözlüğü/çeviri → **dikkat**: eğer `UI` veya `t()` kullanıyorsa lokal `UI_STRINGS` const'a inline et (Aşama 2-3'teki pattern)

### PublicMenu.tsx'ten FilterPanel'ı sil

FilterPanel fonksiyonunun tam gövdesini PublicMenu.tsx'ten sil.

### PublicMenu.tsx'e import ekle

```typescript
import { FilterPanel } from '../components/menu/FilterPanel';
```

### BUILD TEST (Adım 1 sonrası)

```bash
npm run build
```

**Build hata verirse DURDUR, raporla.** Commit atma, sonraki adıma geçme.

---

## ADIM 2: BentoCategoryCard.tsx OLUŞTUR

### Dosya: `src/components/menu/BentoCategoryCard.tsx`

PublicMenu.tsx'te `function BentoCategoryCard({ ... }) { ... }` bloğunu bul.

### DİKKAT — IntersectionObserver

BentoCategoryCard IntersectionObserver + opacity+scale animation + delay kullanıyor (memory'de kayıtlı: "BentoCategoryCard bileşeni: IntersectionObserver, opacity+scale animasyon, stagger efekti"). Bu logic'in AYNEN korunması kritik — animasyon bozulursa 15 Nisan'da eklenen bento grid görsel olarak bozulur.

Yeni dosya şablonu:

```typescript
// src/components/menu/BentoCategoryCard.tsx
// Bento/masonry layout'ta kategori kartı
// IntersectionObserver ile scroll animasyonu (opacity + scale)
// PublicMenu.tsx'ten çıkarıldı

import { useState, useEffect, useRef } from 'react';
import type { LangCode, MenuCategory } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
// Diğer gerekli import'lar

export function BentoCategoryCard({
  /* mevcut prop'lar AYNEN */
}: {
  /* mevcut type definitions AYNEN */
}) {
  // PublicMenu.tsx'teki BentoCategoryCard fonksiyonunun İÇ GÖVDESİNİ AYNEN buraya taşı.
  // IntersectionObserver setup, isVisible state, delay logic, opacity+scale styles — HİÇBİR ŞEY DEĞİŞMEYECEK.
  // Video URL handling (YouTube/Vimeo/direct) ve fallback gradient de aynen korunacak.
}
```

### PublicMenu.tsx'ten BentoCategoryCard'ı sil ve import ekle

```typescript
import { BentoCategoryCard } from '../components/menu/BentoCategoryCard';
```

### BUILD TEST (Adım 2 sonrası)

```bash
npm run build
```

**Build hata verirse DURDUR, raporla.**

---

## ADIM 3: NutritionFactsTable.tsx OLUŞTUR

### Dosya: `src/components/menu/NutritionFactsTable.tsx`

PublicMenu.tsx'te `function NutritionFactsTable({ ... }) { ... }` bloğunu bul (genelde dosyanın son bileşeni).

Yeni dosya şablonu:

```typescript
// src/components/menu/NutritionFactsTable.tsx
// AB uyumlu besin değerleri tablosu (Enerji kJ+kcal, trafik ışığı dot'ları, RI%)
// PublicMenu.tsx'ten çıkarıldı

import type { LangCode, Nutrition } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';
import {
  kcalToKj,
  sodiumToSalt,
  getRIPercent,
  getTrafficLight,
  TRAFFIC_LIGHT_COLORS,
  formatNutritionValue,
} from '../../lib/nutritionEU';
// Diğer gerekli import'lar

export function NutritionFactsTable({
  /* mevcut prop'lar AYNEN */
}: {
  /* mevcut type definitions AYNEN */
}) {
  // PublicMenu.tsx'teki NutritionFactsTable fonksiyonunun İÇ GÖVDESİNİ AYNEN buraya taşı.
  // EU format, traffic light, RI%, decimal format — hiçbir şey değişmeyecek.
}
```

### PublicMenu.tsx'ten NutritionFactsTable'ı sil ve import ekle

```typescript
import { NutritionFactsTable } from '../components/menu/NutritionFactsTable';
```

### BUILD TEST (Adım 3 sonrası)

```bash
npm run build
```

---

## ADIM 4: FINAL COMMIT + PUSH

3 adım da başarılıysa, tek commit olarak push et:

```bash
git add src/pages/PublicMenu.tsx \
        src/components/menu/FilterPanel.tsx \
        src/components/menu/BentoCategoryCard.tsx \
        src/components/menu/NutritionFactsTable.tsx

git commit -m "refactor(4/4): Extract FilterPanel, BentoCategoryCard, NutritionFactsTable to src/components/menu/"

git push git@github.com:kiranmurat-source/swift-table-menu.git main
```

---

## GENEL KURALLAR

1. **Bileşen iç mantığına DOKUNMA** — JSX, style, state logic, IntersectionObserver, animasyon — aynen kopyala
2. **Sırayla yap** — önce FilterPanel, sonra BentoCategoryCard, sonra NutritionFactsTable. Her adım sonrası build al.
3. **Bir adım hata verirse DURDUR** — sonraki adıma geçme, raporla
4. **Dışarıdan kullanım yok** — bu 3 bileşen sadece PublicMenu.tsx'te kullanılıyor (grep kontrolü yapıldı)
5. **UI dictionary bağımlılıkları** — eğer bileşen PublicMenu.tsx'teki büyük `UI` objesini veya `t()` fonksiyonunu kullanıyorsa, bu metinleri lokal `UI_STRINGS` const'a inline et (önceki aşamalardaki pattern)
6. **MenuItemCard ve ItemDetailModal'a dokunma** — bunlar büyük ve riskli, bu aşamada taşınmıyor
7. **Ana PublicMenu component'ine dokunma** — sadece 3 fonksiyon silinir ve 3 import eklenir
8. **Commit atarken 4 dosyayı beraber ekle** — tek commit'te bitir

## TEST CHECKLIST

Her adım sonrası build test, son adımda production test:

### Build testleri (her adım sonrası)
- ✅ TypeScript hatası yok
- ✅ Build başarılı
- ✅ Bundle boyutu anormal değil (~230KB civarı gzip)

### Production test (son deploy sonrası)
URL: https://tabbled.com/menu/ramada-encore-bayrampasa

**FilterPanel:**
- Filter butonuna tıkla → drawer açılıyor mu? ✅
- Kategori/diyet/alerjen filtreleri seçilebiliyor mu? ✅
- "Uygula" sonrası ürünler filtreleniyor mu? ✅

**BentoCategoryCard:**
- Kategori grid view'da kartlar bento layout'ta mı? ✅
- **Scroll animasyonu** (opacity + scale) çalışıyor mu? ✅ — EN KRİTİK
- Stagger efekti (sağ kart delay'li) çalışıyor mu? ✅
- Video arka plan olan kategori varsa oynatılıyor mu? ✅

**NutritionFactsTable:**
- Ürün detayında besin değerleri tablosu görünüyor mu? ✅
- Enerji kJ+kcal birlikte yazıyor mu? ✅
- Trafik ışığı dot'ları (yağ/doymuş/şeker/tuz) doğru renkli mi? ✅
- RI% hesaplaması doğru mu? ✅

## BAŞARI KRİTERLERİ

- ✅ `src/components/menu/FilterPanel.tsx` oluşturuldu
- ✅ `src/components/menu/BentoCategoryCard.tsx` oluşturuldu
- ✅ `src/components/menu/NutritionFactsTable.tsx` oluşturuldu
- ✅ PublicMenu.tsx'te 3 fonksiyon tanımı silindi, 3 import satırı eklendi
- ✅ PublicMenu.tsx satır sayısı ~2585'e düştü (3042'den ~457 satır az)
- ✅ `npm run build` hatasız (her adımda)
- ✅ Production'da 3 bileşenin davranışı bozulmadı
- ✅ Bento scroll animasyonu (en kritik) çalışıyor

## HATA DURUMU

Bir adım hata verirse:
1. HEMEN DURDUR — sonraki adıma GEÇME
2. Hangi adımda hata olduğunu raporla
3. Hata mesajını tam olarak paylaş
4. Git'e commit ATMA (henüz push yapmadık)
5. Yeni prompt bekleyeceğim

Özellikle dikkat:
- **"Cannot find name 'UI'"** → lokal UI_STRINGS const'a inline et (Aşama 2-3 pattern)
- **"Cannot find name 't'"** → bu translation fonksiyonu PublicMenu.tsx'te kaldı, bileşene `t` prop olarak geçmiyorsa → inline stringler kullan veya UI_STRINGS
- **Runtime animasyon bozulması** → BentoCategoryCard IntersectionObserver setup'ı tam taşınmamıştır, kod parçasını baştan sona kontrol et

## ÖNCELİK SIRASI

1. Güncel satır numaralarını doğrula
2. ADIM 1: FilterPanel taşı → build → (hatayoksa devam)
3. ADIM 2: BentoCategoryCard taşı → build → (hata yoksa devam)
4. ADIM 3: NutritionFactsTable taşı → build
5. ADIM 4: Tek commit, push
6. Aşama 4 BİTTİ — refactor serisi tamamlandı
