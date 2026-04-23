# UI Strings Consolidation — Merkezi i18n Dosyası

## PROJE BAĞLAMI

Bugün yaptığımız 4 aşamalı PublicMenu.tsx refactor sırasında, bileşenler ayrıldıkça PublicMenu'deki büyük `UI` objesine bağımlılıkları koparmak için 4 ayrı inline dil objesi oluşturuldu:

1. `STARTING_FROM_TEMPLATES` — `src/lib/menuHelpers.ts` (satır 7)
2. `UI_STRINGS` (Nutri-Score) — `src/components/menu/NutriScoreBadge.tsx` (satır 18)
3. `UI_STRINGS` (Nutrition) — `src/components/menu/NutritionFactsTable.tsx` (satır 17)
4. `FILTER_LABELS` — `src/components/menu/FilterPanel.tsx` (satır 11)

**Sorun:** Aynı pattern 4 yerde tekrarlanıyor. Her biri Record<UiLangCode, ...> tipinde, sadece içerikleri farklı. Bu teknik borç — ilerde bir metin güncellenmesi gerektiğinde hangi dosyada olduğunu aramak gerek.

## HEDEF

Tüm inline dil objelerini **tek merkezi dosyaya** topla: `src/lib/menuI18n.ts`

Sonuç:
- 4 ayrı dosyadaki inline const'lar silinir
- Yeni `menuI18n.ts` tek kaynak olarak export eder
- Bileşenler import edip kullanır
- Davranış değişmez — sadece kod organizasyonu iyileşir

## DOKUNULMAYACAKLAR

**PublicMenu.tsx:**
- `const UI` (satır 132) — büyük ana sözlük, AYNEN KALIR
- `function t()` (satır 81) — AYNEN KALIR

Bu ikisi ileride admin panel i18n sprint'inde (EN + AR) büyük bir refactor'la taşınacak. Bu aşamada dokunulmuyor.

## ADIM 1: YENİ DOSYAYI OLUŞTUR

`src/lib/menuI18n.ts` dosyasını oluştur:

```typescript
// src/lib/menuI18n.ts
// Merkezi dil sözlüğü — menu bileşenleri için
// PublicMenu.tsx'teki ana UI objesinden ayrı (o büyük refactor başka sprint)

import type { UiLangCode } from '../types/menu';

// ============================================================================
// STARTING FROM TEMPLATES (menuHelpers.ts'ten)
// Varyantlı ürün fiyat gösterimi: "X TL'den başlayan"
// ============================================================================
export const STARTING_FROM_TEMPLATES: Record<UiLangCode, string> = {
  // menuHelpers.ts'teki mevcut içeriği AYNEN taşı
};

// ============================================================================
// NUTRI-SCORE STRINGS (NutriScoreBadge.tsx'ten)
// Dropdown başlığı, açıklama, sağlık karşılaştırma metinleri
// ============================================================================
export const NUTRI_SCORE_STRINGS: Record<string, Record<UiLangCode, string>> = {
  // NutriScoreBadge.tsx'teki UI_STRINGS içeriğini AYNEN taşı
};

// ============================================================================
// NUTRITION FACTS STRINGS (NutritionFactsTable.tsx'ten)
// Besin değerleri tablosu: Enerji, Yağ, Doymuş, Karbonhidrat, vb.
// ============================================================================
export const NUTRITION_STRINGS: Record<string, Record<UiLangCode, string>> = {
  // NutritionFactsTable.tsx'teki UI_STRINGS içeriğini AYNEN taşı
};

// ============================================================================
// FILTER STRINGS (FilterPanel.tsx'ten)
// Filtre drawer etiketleri
// ============================================================================
export const FILTER_STRINGS = {
  // FilterPanel.tsx'teki FILTER_LABELS içeriğini AYNEN taşı
  // (tip yapısı Record<UiLangCode, {...}> — bileşenden kopyala)
};
```

**KRİTİK:** Her 4 objenin **içeriğini DEĞİŞTİRMEDEN, birebir kopyala**. Sadece yerini değiştiriyoruz.

### Not — İsim değişiklikleri

Eski isimleri yeni isimlerle değiştirdik (netlik için):
- `STARTING_FROM_TEMPLATES` → `STARTING_FROM_TEMPLATES` (aynı)
- `UI_STRINGS` (NutriScoreBadge) → `NUTRI_SCORE_STRINGS`
- `UI_STRINGS` (NutritionFactsTable) → `NUTRITION_STRINGS`
- `FILTER_LABELS` → `FILTER_STRINGS`

Çünkü `UI_STRINGS` jenerik isim, 2 yerde kullanılıyor ve çakışabilir. Component dosyasında local UI_STRINGS adıyla import ederseniz yine işe yarar ama yeni isimler daha açık.

## ADIM 2: DÖRT DOSYAYI GÜNCELLE

### 2a) `src/lib/menuHelpers.ts`

**Sil:** Satır 7'deki `const STARTING_FROM_TEMPLATES = {...}` bloğu

**Ekle (dosya üstüne):**
```typescript
import { STARTING_FROM_TEMPLATES } from './menuI18n';
```

Satır 33'teki `STARTING_FROM_TEMPLATES[uiLang]` kullanımı aynı kalır (import'tan gelen şimdi).

### 2b) `src/components/menu/NutriScoreBadge.tsx`

**Sil:** Satır 18'deki `const UI_STRINGS = {...}` bloğu

**Ekle (import'ların yanına):**
```typescript
import { NUTRI_SCORE_STRINGS as UI_STRINGS } from '../../lib/menuI18n';
```

**Neden alias?** İç kullanımda `UI_STRINGS.nutriScoreTitle[uiLang]` referansları var (satır 98, 100, 133, 134, 173). Alias kullanırsak bu satırlara dokunmaya gerek kalmaz.

### 2c) `src/components/menu/NutritionFactsTable.tsx`

**Sil:** Satır 17'deki `const UI_STRINGS = {...}` bloğu

**Ekle:**
```typescript
import { NUTRITION_STRINGS as UI_STRINGS } from '../../lib/menuI18n';
```

Aynı alias mantığı — dosyadaki `UI_STRINGS.energy[uiLang]` gibi 10+ kullanım aynı kalır.

### 2d) `src/components/menu/FilterPanel.tsx`

**Sil:** Satır 11'deki `const FILTER_LABELS = {...}` bloğu

**Ekle:**
```typescript
import { FILTER_STRINGS as FILTER_LABELS } from '../../lib/menuI18n';
```

Satır 54'teki `FILTER_LABELS[toUiLang(lang)]` kullanımı aynı kalır.

## GENEL KURALLAR

1. **İçeriği DEĞİŞTİRMEDEN taşı** — her string, her dil, her anahtar birebir aynı
2. **Import path'leri doğru:** `menuI18n.ts` `src/lib/` altında, bileşenler `src/components/menu/` altında → `../../lib/menuI18n`
3. **Ana UI objesine (PublicMenu.tsx satır 132) DOKUNMA**
4. **`t()` fonksiyonuna (PublicMenu.tsx satır 81) DOKUNMA**
5. **Alias kullan** (NUTRI_SCORE_STRINGS as UI_STRINGS) — böylece bileşenlerin iç kullanımını değiştirmek gerekmiyor
6. **Tip tutarlılığı** — `Record<string, Record<UiLangCode, string>>` pattern'ini koru. FILTER_STRINGS farklı tip kullanıyor (Record<UiLangCode, {...}>), onu da bileşenden birebir kopyala.

## TEST CHECKLIST

### Build
1. `npm run build` çalıştır
2. TypeScript hatası olmamalı
3. Bundle size değişmemeli (sadece kod taşıdık, ekleme/silme yok)

### Production Test (Ramada menüsü üzerinden)
Tüm bu noktaları Türkçe **ve** İngilizce için test et:

**Language Switcher ile İngilizce'ye geç:**

1. **STARTING_FROM_TEMPLATES testi:**
   - Varyantlı bir ürün bul (örn. bir menü kahvaltı ürünü 2-3 boyutla)
   - Kart üzerinde "X TL'den başlayan" / "Starting from X TL" doğru görünmeli

2. **Nutri-Score dropdown testi:**
   - "Bol Tahıllı Salata" veya "Patates Tava" kartındaki A/D badge'e tıkla
   - Dropdown açılır — başlık ve açıklama metinleri doğru dilde
   - "Healthier" / "Less Healthy" etiketleri İngilizce için doğru

3. **Nutrition Table testi:**
   - Bol Tahıllı Salata detay modalını aç
   - "Besin Değerleri" / "Nutrition Facts" tablosu
   - Enerji, Yağ, Doymuş, Karbonhidrat, Şeker, Protein, Tuz etiketleri doğru dilde
   - "100g başına" / "Per 100g" doğru
   - Referans alım notu (RI%) doğru

4. **Filter Panel testi:**
   - Ana menüde sağdaki filtre butonuna tıkla
   - Filtre drawer açılır
   - Diyet, Alerjen, Kategori başlıkları doğru dilde

### Başarı Kriterleri

- ✅ `npm run build` hatasız
- ✅ `src/lib/menuI18n.ts` 4 export ediyor
- ✅ 4 dosyada inline const silindi, import eklendi
- ✅ Production'da tüm dil metinleri aynı görünüyor
- ✅ PublicMenu.tsx ve t() fonksiyonuna dokunulmadı

## HATA DURUMLARI

**"Cannot find name 'STARTING_FROM_TEMPLATES'"**
→ Import eklenmemiş. Her bileşenin başına import ekle.

**TypeScript "Type is not assignable"**
→ Yeni dosyadaki tip tanımı eskisinden farklı. Birebir kopyalamadın. İç yapıyı ve tip parametrelerini aynı tut.

**Production'da bazı çeviriler eksik**
→ Yeni dosyaya tamamını taşımadın. Eski const'ların tüm satırlarını karşılaştır, eksik kalan dil olmadığından emin ol.

## COMMIT + PUSH

Build başarılıysa:

```bash
git add src/lib/menuI18n.ts \
        src/lib/menuHelpers.ts \
        src/components/menu/NutriScoreBadge.tsx \
        src/components/menu/NutritionFactsTable.tsx \
        src/components/menu/FilterPanel.tsx

git commit -m "refactor: Consolidate menu component i18n strings into src/lib/menuI18n.ts"

git push git@github.com:kiranmurat-source/swift-table-menu.git main
```

## ÖNCELİK SIRASI

1. `src/lib/menuI18n.ts` oluştur, 4 objeyi birebir kopyala
2. `menuHelpers.ts`'ten STARTING_FROM_TEMPLATES sil, import ekle
3. `NutriScoreBadge.tsx`'ten UI_STRINGS sil, aliaslı import ekle
4. `NutritionFactsTable.tsx`'ten UI_STRINGS sil, aliaslı import ekle
5. `FilterPanel.tsx`'ten FILTER_LABELS sil, aliaslı import ekle
6. `npm run build`
7. Commit + push
8. Production test (Ramada menüsü EN/TR)
9. Bitir
