# Refactor Aşama 3/4 — Nutri-Score Bileşenlerini Ayırma

## PROJE BAĞLAMI

Tabbled QR menü platformu (tabbled.com). `src/pages/PublicMenu.tsx` dosyası şu an 3288 satır (Aşama 1 + 2 sonrası). Kademeli refactor devam ediyor.

**Önemli bulgu:** `NUTRI_SCORE_COLORS`, `NUTRI_SCORE_LABELS`, `nutriScoreTextColor`, `NutriScore` tipi zaten `src/lib/nutritionEU.ts` dosyasında tanımlı — PublicMenu.tsx onları import ediyor. Bu Aşama 3'ü basitleştiriyor: sadece iki React component'ini taşıyacağız.

**Bileşenlerin konumu (PublicMenu.tsx içinde):**
- `function NutriScoreBadge({ ... })` — yaklaşık satır 3050 civarı (tıklayınca dropdown açan tek harf badge)
- `function NutriScoreStrip({ ... })` — yaklaşık satır 3210 civarı (5 harfli detay modal stripi)

## AŞAMA 3 GÖREVİ

İki React component'i ayrı dosyalara taşı:

1. `src/components/menu/NutriScoreBadge.tsx` oluştur — ürün kartlarında kullanılan tek harf badge + dropdown
2. `src/components/menu/NutriScoreStrip.tsx` oluştur — detay modalda kullanılan 5 harfli kompakt strip

Sabitler (`NUTRI_SCORE_COLORS`, vs.) TAŞINMIYOR — zaten `lib/nutritionEU.ts`'te.

## ADIM 0: KESIN SATIR NUMARALARINI BUL

Refactor öncesinde kesin satır numaralarını tespit et (satırlar Aşama 1-2 nedeniyle kaymış olabilir):

```bash
grep -n "^function NutriScoreBadge\|^function NutriScoreStrip\|^function NutritionFactsTable" src/pages/PublicMenu.tsx
```

Bu komut sana NutriScoreBadge, NutriScoreStrip ve bir sonraki fonksiyonun (muhtemelen NutritionFactsTable üstte, veya dosya sonu) satır numaralarını verecek. Bu aralıkları bil:

- **NutriScoreBadge bloğu:** `function NutriScoreBadge` satırından → `NutriScoreStrip` (veya sonraki fonksiyon) satırına kadar
- **NutriScoreStrip bloğu:** `function NutriScoreStrip` satırından → dosya sonuna kadar (muhtemelen dosyanın son fonksiyonu)

## ADIM 1: `src/components/menu/` KLASÖRÜNÜ OLUŞTUR

```bash
mkdir -p /opt/khp/tabbled/src/components/menu
```

## ADIM 2: NutriScoreBadge.tsx OLUŞTUR

`src/components/menu/NutriScoreBadge.tsx` dosyasını oluştur:

```typescript
// src/components/menu/NutriScoreBadge.tsx
// Ürün kartlarında kullanılan tek harf Nutri-Score badge
// Tıklanınca 5 harfli dropdown açar
// PublicMenu.tsx'ten çıkarıldı

import { useState, useRef } from 'react';
import {
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_LABELS,
  nutriScoreTextColor,
  type NutriScore,
} from '../../lib/nutritionEU';
import type { LangCode } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';

export function NutriScoreBadge({
  score,
  lang,
  theme,
  size = 20,
}: {
  score: NutriScore;
  lang: LangCode;
  theme: MenuTheme;
  size?: number;
}) {
  // PublicMenu.tsx'teki NutriScoreBadge fonksiyonunun iç gövdesini AYNEN buraya taşı.
  // İç logic, JSX, style'lar — hiçbir şeyi değiştirme.
  // Sadece başlık imza yukarıdaki (export function NutriScoreBadge) satırıyla aynı olmalı.
  
  /* MEVCUT IÇERIK AYNEN */
}
```

**KRİTİK:** NutriScoreBadge'in iç gövdesi AYNEN taşınacak. Dropdown, hover state, tıklama, style'lar — hiçbir şey değişmeyecek. Başına `export` ekle, `function NutriScoreBadge` olarak bırak.

## ADIM 3: NutriScoreStrip.tsx OLUŞTUR

`src/components/menu/NutriScoreStrip.tsx` dosyasını oluştur:

```typescript
// src/components/menu/NutriScoreStrip.tsx
// Detay modalında kullanılan 5 harfli kompakt Nutri-Score stripi
// Seçili harf büyük + halo'lu, diğerleri solgun
// PublicMenu.tsx'ten çıkarıldı

import {
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_LABELS,
  nutriScoreTextColor,
  type NutriScore,
} from '../../lib/nutritionEU';
import type { LangCode } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';

export function NutriScoreStrip({
  score,
  lang,
  theme,
}: {
  score: NutriScore;
  lang: LangCode;
  theme: MenuTheme;
}) {
  // PublicMenu.tsx'teki NutriScoreStrip fonksiyonunun iç gövdesini AYNEN buraya taşı.
  // A-E strip render logic, style'lar — hiçbir şeyi değiştirme.
  
  /* MEVCUT IÇERIK AYNEN */
}
```

**KRİTİK:** NutriScoreStrip'in iç gövdesi AYNEN taşınacak. Render logic, style değerleri (42x42 seçili, 32x32 diğerleri, opacity 0.35, vs.) — hiçbir şey değişmeyecek.

## ADIM 4: PUBLICMENU.TSX'TEN ESKI TANIMLARI SİL

PublicMenu.tsx içinde:
- `function NutriScoreBadge(...) { ... }` bloğunu **tamamen sil**
- `function NutriScoreStrip(...) { ... }` bloğunu **tamamen sil**

Her iki fonksiyonun başlangıç `function ...` satırından kapanış `}` parantezine kadar olan blokları komple sil.

## ADIM 5: PUBLICMENU.TSX'TE IMPORT EKLE

PublicMenu.tsx'in import bölümüne yeni import satırları ekle (mevcut `AllergenBadgeList` import'u gibi bileşen import'larının yanına):

```typescript
import { NutriScoreBadge } from '../components/menu/NutriScoreBadge';
import { NutriScoreStrip } from '../components/menu/NutriScoreStrip';
```

## ADIM 6: IMPORT TEMİZLİĞİ KONTROLÜ

Şu olabilir: `useState`, `useRef` gibi React hook'ları artık NutriScoreBadge için PublicMenu.tsx'te gerekmeyebilir. AMA — başka yerlerde de kullanılıyorlardır (42 hook kullanımı var). **Import bloğuna dokunma**, sadece yeni import satırlarını ekle.

## GENEL KURALLAR

1. **Bileşen iç mantığına DOKUNMA** — JSX, style, state logic — aynen kopyala
2. **Sabitleri (`NUTRI_SCORE_COLORS`, vs.) taşıma** — zaten `lib/nutritionEU`'te, her iki yeni dosya oradan import eder
3. **`toUiLang` import edildiği için** — `lib/menuHelpers.ts`'ten gelmeli (Aşama 2'de taşıdık)
4. **MenuTheme tipi** — `lib/themes.ts`'ten `import type { MenuTheme }` ile gelmeli
5. **LangCode tipi** — `types/menu.ts`'ten `import type { LangCode }` ile gelmeli
6. **NutriScore tipi** — `lib/nutritionEU.ts`'ten `import type { NutriScore }` ile gelmeli
7. **Ana PublicMenu component'ine ve diğer bileşenlere DOKUNMA** — MenuItemCard, ItemDetailModal, NutritionFactsTable, FilterPanel, BentoCategoryCard — hiçbiri değişmez

## TEST CHECKLIST

1. `src/components/menu/NutriScoreBadge.tsx` oluşturuldu
2. `src/components/menu/NutriScoreStrip.tsx` oluşturuldu
3. PublicMenu.tsx'te iki fonksiyon tanımı silindi (~280-300 satır azaldı)
4. PublicMenu.tsx'te 2 yeni import satırı var
5. `npm run build` çalıştır — TypeScript hatası olmamalı
6. Build başarılıysa commit + push:
   ```bash
   git add src/pages/PublicMenu.tsx src/components/menu/NutriScoreBadge.tsx src/components/menu/NutriScoreStrip.tsx
   git commit -m "refactor(3/4): Extract NutriScore components to src/components/menu/"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```
7. Vercel deploy bekle (1-2 dk)
8. Production test: https://tabbled.com/menu/ramada-encore-bayrampasa
   - "Bol Tahıllı ve Dana Etli Salata" kartında tek harf A badge görünüyor ✅
   - "Patates Tava" kartında tek harf D badge görünüyor ✅
   - Ürün kartındaki badge'e tıklayınca dropdown açılıyor (5 skala) ✅
   - Detay modal açılınca Nutri-Score strip (5 harfli, seçili büyük) doğru ✅
   - White/black tema uyumu korunuyor ✅
   - Çok dilli label'lar (TR/EN/AR/ZH) çalışıyor ✅

## BAŞARI KRİTERLERİ

- ✅ `src/components/menu/NutriScoreBadge.tsx` oluşturuldu
- ✅ `src/components/menu/NutriScoreStrip.tsx` oluşturuldu
- ✅ PublicMenu.tsx'te her iki fonksiyon silindi
- ✅ PublicMenu.tsx satır sayısı ~2990-3000'e düştü (3288'den ~280-300 satır az)
- ✅ `npm run build` hatasız
- ✅ Production'da Nutri-Score davranışı bozulmadı — kartlarda tek harf, detay modalda 5 harfli strip

## HATA DURUMU

Eğer build "Cannot find name" tipi hata verirse:
- `toUiLang` import'u `../../lib/menuHelpers`'tan mı? (iki seviye up: components/menu → src)
- `NUTRI_SCORE_COLORS` vs. `../../lib/nutritionEU`'dan mı?
- `type MenuTheme` `../../lib/themes`'den, `type NutriScore` `../../lib/nutritionEU`'dan mı?

Eğer component render'da hata verirse (runtime), muhtemelen iç gövde tam taşınmamış — kod parçasının BAŞTAN SONA kopyalandığından emin ol.

**Hata çıkarsa DURDUR, raporla, yeni prompt bekle.**

## ÖNCELİK SIRASI

1. `src/components/menu/` klasörünü oluştur
2. `NutriScoreBadge.tsx` oluştur (import'lar + iç gövde)
3. `NutriScoreStrip.tsx` oluştur (import'lar + iç gövde)
4. PublicMenu.tsx'ten iki fonksiyonu sil
5. PublicMenu.tsx'e 2 import satırı ekle
6. Build → commit → push
7. Aşama 3 bitir — Aşama 4 için ayrı prompt gelecek
