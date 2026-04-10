# TABBLED — İKON MİGRATİON PROMPT
## Phosphor Icons + Erudus Allerjen İkonları

---

## GENEL BAKIŞ

Bu prompt 3 ana iş yapacak:
1. **Phosphor Icons kurulumu** + tüm Circum Icons değişimi
2. **Erudus allerjen ikonları** entegrasyonu — SADECE 14 AB alerjen + 4 diyet tercihi
3. **Admin allerjen seçici** sadeleştirme — fazla food ikonları kaldır

**KRİTİK KURALLAR:**
- shadcn/ui internal bileşenlerindeki Lucide ikonlarına DOKUNMA (ChevronDown, Check, X, vb.)
- Sadece bizim yazdığımız bileşenlerdeki `react-icons/ci` import'larını değiştir
- `npm run build` ile test et, hata varsa düzelt

---

## ADIM 1: PHOSPHOR ICONS KURULUMU

```bash
cd /opt/khp/tabbled
npm install @phosphor-icons/react
```

---

## ADIM 2: TÜM CIRCUM ICONS → PHOSPHOR ICONS DEĞİŞİMİ

### Önce mevcut Circum Icons kullanımlarını bul:

```bash
grep -rn "from \"react-icons/ci\"" src/ --include="*.tsx" --include="*.ts"
grep -rn "from 'react-icons/ci'" src/ --include="*.tsx" --include="*.ts"
```

### Mapping tablosu (Circum → Phosphor):

Phosphor import formatı:
```tsx
import { IconName } from "@phosphor-icons/react";
```

| Circum Icon | Phosphor Karşılığı | Kullanım Yeri |
|---|---|---|
| CiSearch | MagnifyingGlass | Arama |
| CiFilter | Funnel | Filtre |
| CiCircleCheck | CheckCircle | Onay/başarı |
| CiCircleRemove | XCircle | Kaldırma/hata |
| CiCirclePlus | PlusCircle | Ekleme |
| CiCircleMinus | MinusCircle | Çıkarma |
| CiEdit | PencilSimple | Düzenleme |
| CiTrash | Trash | Silme |
| CiSettings | Gear | Ayarlar |
| CiLogout | SignOut | Çıkış |
| CiUser | User | Kullanıcı |
| CiShop | Storefront | Restoran/dükkan |
| CiClock1 | Clock | Saat |
| CiClock2 | Clock | Saat (alternatif) |
| CiTimer | Timer | Zamanlayıcı/hazırlanma süresi |
| CiCalendar | Calendar | Takvim |
| CiCalendarDate | CalendarBlank | Takvim tarih |
| CiStar | Star | Yıldız/favori |
| CiHeart | Heart | Kalp/beğeni |
| CiMenuBurger | List | Hamburger menü |
| CiMenuKebab | DotsThreeVertical | Kebab menü |
| CiGrid41 | SquaresFour | Grid görünüm |
| CiGrid2H | Rows | Liste görünüm |
| CiImageOn | Image | Görsel |
| CiCamera | Camera | Kamera |
| CiLink | Link | Link |
| CiGlobe | Globe | Dünya/dil |
| CiMail | Envelope | E-posta |
| CiPhone | Phone | Telefon |
| CiLocationOn | MapPin | Konum |
| CiWarning | Warning | Uyarı |
| CiCircleInfo | Info | Bilgi |
| CiCircleQuestion | Question | Soru |
| CiMoneyBill | Money | Para |
| CiCreditCard1 | CreditCard | Kredi kartı |
| CiPercent | Percent | Yüzde/indirim |
| CiDiscount1 | Tag | Etiket/indirim |
| CiShoppingCart | ShoppingCart | Sepet |
| CiDeliveryTruck | Truck | Teslimat |
| CiForkAndKnife | ForkKnife | Yemek |
| CiCoffeeCup | Coffee | Kahve |
| CiPizza | Pizza | Pizza |
| CiBeerMugFull | BeerStein | Bira |
| CiChat1 | ChatCircle | Sohbet |
| CiChat2 | Chat | Sohbet (alternatif) |
| CiBellOn | Bell | Bildirim |
| CiBellOff | BellSlash | Bildirim kapalı |
| CiSaveDown1 | DownloadSimple | İndirme |
| CiSaveUp1 | UploadSimple | Yükleme |
| CiShare1 | ShareNetwork | Paylaşım |
| CiExport | Export | Dışa aktarma |
| CiImport | ArrowSquareIn | İçe aktarma |
| CiRedo | ArrowClockwise | Yineleme |
| CiUndo | ArrowCounterClockwise | Geri alma |
| CiSquarePlus | Plus | Artı |
| CiSquareMinus | Minus | Eksi |
| CiSquareCheck | CheckSquare | Onay kutusu |
| CiViewList | ListBullets | Liste |
| CiViewBoard | Kanban | Board |
| CiViewTable | Table | Tablo |
| CiTextAlignLeft | TextAlignLeft | Metin hizala |
| CiTextBold | TextBolder | Kalın |
| CiTextItalic | TextItalic | İtalik |
| CiTextUnderline | TextUnderline | Altçizgi |
| CiTextStrikethrough | TextStrikethrough | Üstçizgi |
| CiBoxList | ListChecks | Kontrol listesi |
| CiShuffle | Shuffle | Karıştır |
| CiPlay1 | Play | Oynat |
| CiPause1 | Pause | Duraklat |
| CiStop1 | Stop | Durdur |
| CiMaximize1 | ArrowsOut | Büyüt |
| CiMinimize1 | ArrowsIn | Küçült |
| CiZoomIn | MagnifyingGlassPlus | Yakınlaştır |
| CiZoomOut | MagnifyingGlassMinus | Uzaklaştır |
| CiLock | Lock | Kilit |
| CiUnlock | LockOpen | Kilit açık |
| CiPower | Power | Güç |
| CiDark | Moon | Karanlık mod |
| CiLight | Sun | Aydınlık mod |
| CiMenuFries | ListDashes | Menü çizgiler |
| CiCircleMore | DotsThree | Daha fazla |
| CiRepeat | ArrowsClockwise | Tekrar |
| CiHashtag | Hash | Hashtag |
| CiQR | QrCode | QR kod |
| CiFlag1 | Flag | Bayrak |
| CiBookmark | BookmarkSimple | Yer imi |
| CiHome | House | Ana sayfa |
| CiDollar | CurrencyDollar | Dolar |
| CiMoneyCheck1 | Receipt | Fiş |
| CiFileOn | File | Dosya |
| CiFolderOn | Folder | Klasör |
| CiPaperplane | PaperPlaneRight | Gönder |
| CiPickerEmpty | Palette | Renk seçici |
| CiDroplet | Drop | Damla |
| CiMap | MapTrifold | Harita |

### DEĞİŞTİRME STRATEJİSİ:

1. **Her dosyayı tek tek aç**, mevcut Circum import'ları bul
2. Import satırını Phosphor formatına çevir
3. JSX içindeki ikon kullanımlarını güncelle
4. Eğer tabloda olmayan bir Circum Icon varsa, Phosphor'da en yakın karşılığını bul

### PHOSPHOR İKON AĞIRLIK STANDARDI:

```tsx
// Genel kullanım — Regular (varsayılan, weight prop verme)
<MagnifyingGlass size={20} />

// Aktif durum / CTA butonları — Bold
<PlusCircle size={20} weight="bold" />

// Toggle açık durumu — Fill
<Star size={20} weight="fill" />

// Toggle kapalı durumu — Regular (varsayılan)
<Star size={20} />
```

### İKON BOYUT KURALI:
İkon boyutu = yanındaki metnin line-height'ına eşit
- 12px text → size={14}
- 14px text → size={16}
- 16px text → size={18}
- 20px text → size={22}
- Butonlardaki standalone ikonlar → size={20}
- Navbar/header ikonlar → size={24}

---

## ADIM 3: ALLERJEN LİSTESİ SADELEŞTİRME + ERUDUS İKONLARI

### 3a. Erudus SVG dosyalarını indir

```bash
cd /opt/khp/tabbled
mkdir -p /tmp/erudus-icons
cd /tmp/erudus-icons
git clone https://github.com/Erudus/erudus-icons.git

# Dosya yapısını kontrol et
ls erudus-icons/src/svg/

# Sadece ihtiyacımız olan circle versiyonlarını kopyala
mkdir -p /opt/khp/tabbled/public/allergens-new
cp erudus-icons/src/svg/circle-cereal.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-crustaceans.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-eggs.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-fish.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-peanuts.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-soybeans.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-milk.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-nuts.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-celery.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-mustard.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-sesame.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-sulphites.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-lupin.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-molluscs.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-vegetarian.svg /opt/khp/tabbled/public/allergens-new/
cp erudus-icons/src/svg/circle-vegan.svg /opt/khp/tabbled/public/allergens-new/
```

Eğer dosya adları farklıysa (örn. `circle_cereal.svg` veya `cereal.svg`), `ls` çıktısına göre düzelt.

### 3b. Halal ve Kosher SVG oluştur (Erudus'ta yok)

```bash
cat > /opt/khp/tabbled/public/allergens-new/halal.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="none" stroke="#2E7D32" stroke-width="3"/>
  <text x="50" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#2E7D32">حلال</text>
  <text x="50" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#2E7D32">HALAL</text>
</svg>
SVGEOF

cat > /opt/khp/tabbled/public/allergens-new/kosher.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="none" stroke="#1565C0" stroke-width="3"/>
  <text x="50" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1565C0">K</text>
  <text x="50" y="62" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#1565C0">KOSHER</text>
</svg>
SVGEOF
```

### 3c. Eski allergens klasörünü değiştir

```bash
mv /opt/khp/tabbled/public/allergens /opt/khp/tabbled/public/allergens-old-backup
mv /opt/khp/tabbled/public/allergens-new /opt/khp/tabbled/public/allergens
```

### 3d. allergens.ts TAM YENİDEN YAZ

`src/lib/allergens.ts` dosyasını SİL ve aşağıdakiyle oluştur:

```typescript
// ============================================
// ALLERJEN VE DİYET TERCİHLERİ
// Sadece 14 AB zorunlu alerjen + 4 diyet tercihi
// Fazla food ikonu YOK (elma, muz, mantar vb. kaldırıldı)
// ============================================

export interface AllergenItem {
  key: string;
  name_tr: string;
  name_en: string;
  icon: string;
  category: 'eu14' | 'diet';
}

// === 14 AB ZORUNLU ALERJEN (EU Regulation 1169/2011) ===
export const ALLERGEN_LIST: AllergenItem[] = [
  { key: 'cereal',       name_tr: 'Gluten (Tahıl)',           name_en: 'Cereals (Gluten)',  icon: 'circle-cereal',       category: 'eu14' },
  { key: 'milk',         name_tr: 'Süt',                      name_en: 'Milk',              icon: 'circle-milk',         category: 'eu14' },
  { key: 'eggs',         name_tr: 'Yumurta',                  name_en: 'Eggs',              icon: 'circle-eggs',         category: 'eu14' },
  { key: 'fish',         name_tr: 'Balık',                    name_en: 'Fish',              icon: 'circle-fish',         category: 'eu14' },
  { key: 'crustaceans',  name_tr: 'Kabuklu Deniz Ürünleri',   name_en: 'Crustaceans',       icon: 'circle-crustaceans',  category: 'eu14' },
  { key: 'peanuts',      name_tr: 'Yer Fıstığı',             name_en: 'Peanuts',           icon: 'circle-peanuts',      category: 'eu14' },
  { key: 'soybeans',     name_tr: 'Soya',                     name_en: 'Soybeans',          icon: 'circle-soybeans',     category: 'eu14' },
  { key: 'nuts',         name_tr: 'Sert Kabuklu Meyveler',    name_en: 'Tree Nuts',         icon: 'circle-nuts',         category: 'eu14' },
  { key: 'celery',       name_tr: 'Kereviz',                  name_en: 'Celery',            icon: 'circle-celery',       category: 'eu14' },
  { key: 'mustard',      name_tr: 'Hardal',                   name_en: 'Mustard',           icon: 'circle-mustard',      category: 'eu14' },
  { key: 'sesame',       name_tr: 'Susam',                    name_en: 'Sesame',            icon: 'circle-sesame',       category: 'eu14' },
  { key: 'sulphites',    name_tr: 'Sülfür Dioksit',           name_en: 'Sulphites',         icon: 'circle-sulphites',    category: 'eu14' },
  { key: 'lupin',        name_tr: 'Acı Bakla (Lupin)',        name_en: 'Lupin',             icon: 'circle-lupin',        category: 'eu14' },
  { key: 'molluscs',     name_tr: 'Yumuşakçalar',             name_en: 'Molluscs',          icon: 'circle-molluscs',     category: 'eu14' },
];

// === DİYET TERCİHLERİ ===
export const DIET_LIST: AllergenItem[] = [
  { key: 'vegetarian',   name_tr: 'Vejetaryen',               name_en: 'Vegetarian',        icon: 'circle-vegetarian',   category: 'diet' },
  { key: 'vegan',        name_tr: 'Vegan',                    name_en: 'Vegan',             icon: 'circle-vegan',        category: 'diet' },
  { key: 'halal',        name_tr: 'Helal',                    name_en: 'Halal',             icon: 'halal',               category: 'diet' },
  { key: 'kosher',       name_tr: 'Koşer',                    name_en: 'Kosher',            icon: 'kosher',              category: 'diet' },
];

// Tüm listeler birleşik
export const ALL_ITEMS = [...ALLERGEN_LIST, ...DIET_LIST];

// === ESKİ KEY → YENİ KEY MAPPING (geriye dönük uyumluluk) ===
const LEGACY_KEY_MAP: Record<string, string> = {
  'gluten': 'cereal',
  'wheat': 'cereal',
  'dairy': 'milk',
  'shellfish': 'crustaceans',
  'shrimp': 'crustaceans',
  'crab': 'crustaceans',
  'lobster': 'crustaceans',
  'treeNuts': 'nuts',
  'tree_nuts': 'nuts',
  'hazelnut': 'nuts',
  'walnut': 'nuts',
  'cashew': 'nuts',
  'almond': 'nuts',
  'soy': 'soybeans',
  'sulfites': 'sulphites',
  'sulphur': 'sulphites',
  'squid': 'molluscs',
  'octopus': 'molluscs',
  'snail': 'molluscs',
  'clam': 'molluscs',
  'oyster': 'molluscs',
  'mussel': 'molluscs',
};

export function normalizeAllergenKey(key: string): string {
  return LEGACY_KEY_MAP[key] || key;
}

export function getAllergenByKey(key: string): AllergenItem | undefined {
  const normalized = normalizeAllergenKey(key);
  return ALL_ITEMS.find(a => a.key === normalized);
}

export function getEU14Allergens(): AllergenItem[] {
  return ALLERGEN_LIST;
}

export function getDietPreferences(): AllergenItem[] {
  return DIET_LIST;
}
```

### 3e. AllergenIcon bileşenini güncelle

`src/components/AllergenIcon.tsx` dosyasını tamamen yeniden yaz:

```tsx
import React from 'react';
import { getAllergenByKey, ALLERGEN_LIST, DIET_LIST, ALL_ITEMS, normalizeAllergenKey } from '../lib/allergens';
import type { AllergenItem } from '../lib/allergens';

export { ALLERGEN_LIST, DIET_LIST, ALL_ITEMS };
export type { AllergenItem };

interface AllergenIconProps {
  allergenKey: string;
  size?: number;
  className?: string;
}

export const AllergenIcon: React.FC<AllergenIconProps> = ({
  allergenKey,
  size = 24,
  className = ''
}) => {
  const normalized = normalizeAllergenKey(allergenKey);
  const allergen = getAllergenByKey(normalized);
  if (!allergen) return null;

  return (
    <img
      src={`/allergens/${allergen.icon}.svg`}
      alt={allergen.name_en}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export const AllergenBadgeList: React.FC<{
  allergens: string[];
  size?: number;
  showLabel?: boolean;
  className?: string;
}> = ({ allergens, size = 20, showLabel = false, className = '' }) => {
  if (!allergens || allergens.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {allergens.map((key) => {
        const normalized = normalizeAllergenKey(key);
        const allergen = getAllergenByKey(normalized);
        if (!allergen) return null;
        return (
          <div key={normalized} className="flex items-center gap-1" title={allergen.name_tr}>
            <AllergenIcon allergenKey={normalized} size={size} />
            {showLabel && (
              <span className="text-xs text-muted-foreground">{allergen.name_tr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

---

## ADIM 4: ADMIN ALLERJEN SEÇİCİSİNİ GÜNCELLE

RestaurantDashboard.tsx'teki allerjen seçici bölümünü bul ve güncelle.

### İstenen yeni yapı (3 ayrı bölüm):

```
Alerjenler (14 AB Alerjen)
┌─────────────────────────────────────────────────┐
│ □ Gluten    □ Süt    □ Yumurta   □ Balık        │
│ □ Kabuklu   □ Yer Fıstığı  □ Soya  □ Sert Kab. │
│ □ Kereviz   □ Hardal  □ Susam   □ Sülfür Dioks. │
│ □ Lupin     □ Yumuşakçalar                       │
└─────────────────────────────────────────────────┘

Diyet Tercihleri
┌─────────────────────────────────────────────────┐
│ □ Vejetaryen   □ Vegan   □ Helal   □ Koşer     │
└─────────────────────────────────────────────────┘

□ ☆ Öne Çıkar        □ ✦ Yeni Ürün

□ ⊘ Tükendi olarak işaretle
```

### Kod:

```tsx
import { ALLERGEN_LIST, DIET_LIST } from '../lib/allergens';

{/* === ALERJENLER === */}
<div>
  <label className="text-sm font-medium mb-2 block">Alerjenler</label>
  <div className="flex flex-wrap gap-2">
    {ALLERGEN_LIST.map((allergen) => (
      <label
        key={allergen.key}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
          itemForm.allergens?.includes(allergen.key)
            ? 'bg-green-50 border-green-500 text-green-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={itemForm.allergens?.includes(allergen.key) || false}
          onChange={() => toggleAllergen(allergen.key)}
        />
        {allergen.name_tr}
      </label>
    ))}
  </div>
</div>

{/* === DİYET TERCİHLERİ === */}
<div>
  <label className="text-sm font-medium mb-2 block">Diyet Tercihleri</label>
  <div className="flex flex-wrap gap-2">
    {DIET_LIST.map((diet) => (
      <label
        key={diet.key}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
          itemForm.allergens?.includes(diet.key)
            ? 'bg-green-50 border-green-500 text-green-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={itemForm.allergens?.includes(diet.key) || false}
          onChange={() => toggleAllergen(diet.key)}
        />
        {diet.name_tr}
      </label>
    ))}
  </div>
</div>
```

**ÖNEMLİ:**
- Admin formda chip'lerde SVG ikon GÖSTERİLMEYECEK — sadece text label
- İkonlar sadece public menüde gösterilecek
- Öne Çıkar + Yeni Ürün checkbox'ları allerjen bölümünün DIŞINDA ayrı kalacak
- Tükendi toggle da ayrı kalacak

---

## ADIM 5: PUBLIC MENÜ FİLTRE PANELİNİ GÜNCELLE

Public menüdeki filtre bottom sheet'inde allerjen listesini güncelle:
- "Alerjen İçermeyen" bölümü: ALLERGEN_LIST (14 AB alerjen)
- "Tercihler" bölümü: DIET_LIST (Vejetaryen/Vegan/Helal/Koşer) + Popüler + Yeni
- Eski food ikonlarını kaldır

---

## ADIM 6: ESKİ BAĞIMLILIK TEMİZLİĞİ

```bash
# react-icons hala kullanılıyor mu kontrol et
grep -rn "react-icons" src/ --include="*.tsx" --include="*.ts"

# Hiçbir yerde kullanılmıyorsa kaldır
npm uninstall react-icons
```

---

## ADIM 7: BUILD VE TEST

```bash
cd /opt/khp/tabbled
npm run build
```

Build hatası varsa düzelt. Dikkat noktaları:
- Kullanılmayan import'lar
- Yanlış Phosphor ikon adları
- TypeScript tip hataları
- ALLERGEN_LIST import eden tüm dosyaların yeni yapıya uyumu

---

## ADIM 8: GIT PUSH

```bash
cd /opt/khp/tabbled
git add -A
git commit -m "feat: icon migration - Phosphor Icons + Erudus allergens

- Replace all Circum Icons with Phosphor Icons (@phosphor-icons/react)
- Weight: Regular (general), Bold (CTA), Fill (toggle active)
- Simplify allergens: 14 EU mandatory only + 4 diet preferences
- Remove all food icons (apple, banana, beef, mushroom, potato, etc.)
- Add diet preferences: vegan, vegetarian, halal, kosher
- Erudus SVG allergen icons (MIT license)
- Custom halal + kosher SVG icons
- Legacy key mapping for backward compatibility
- Admin: text-only chips, no SVG icons in form
- Public menu: Erudus SVG icons displayed
- shadcn/ui Lucide icons untouched"
git push origin main
```

---

## KONTROL LİSTESİ

- [ ] `@phosphor-icons/react` kuruldu
- [ ] Tüm `react-icons/ci` → `@phosphor-icons/react` değiştirildi
- [ ] shadcn/ui Lucide'a dokunulmadı
- [ ] Ağırlıklar doğru (Regular/Bold/Fill)
- [ ] `src/lib/allergens.ts` — sadece 14 AB alerjen + 4 diyet
- [ ] Eski food ikonları kaldırıldı (elma, muz, mantar, biber, dana, domuz, kivi, portakal, şeftali, patates, matsutake, deniz kulağı, yengeç, kaju, soya fasulyesi, buğday vb.)
- [ ] Erudus SVG'ler `public/allergens/` (14 AB + vegetarian + vegan)
- [ ] Halal + Kosher SVG oluşturuldu
- [ ] `AllergenIcon.tsx` güncellendi
- [ ] `normalizeAllergenKey()` geriye dönük uyumluluk
- [ ] Admin form: 14 alerjen chip (text only, ikon yok)
- [ ] Admin form: 4 diyet tercihi ayrı bölüm
- [ ] Admin form: Öne Çıkar + Yeni Ürün ayrı bölüm
- [ ] Public filtre paneli güncellendi
- [ ] react-icons kaldırıldı (kullanılmıyorsa)
- [ ] `npm run build` başarılı
- [ ] Git push yapıldı
