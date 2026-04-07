# TABBLED — Claude Code Prompt
# 7 Nisan 2026 — Font + Allerjen Ikon + 3 Tema Sistemi

---

## PROJE BAĞLAMI

- **Repo:** /opt/khp/tabbled (GitHub: kiranmurat-source/swift-table-menu)
- **Stack:** React + Vite + TypeScript + shadcn/ui
- **Deploy:** Vercel (git push → otomatik)
- **DB:** Supabase (qmnrawqvkwehufebbkxp.supabase.co)
- **Mevcut font:** Montserrat (değişecek)
- **Mevcut ikonlar:** Circum Icons (react-icons/ci) — shadcn/ui internal Lucide dokunma
- **DB'de mevcut kolon:** restaurants.theme_color (henüz aktif değil)

---

## YAPILACAK 3 GÖREV

### GÖREV 1: Font Değişikliği
### GÖREV 2: Allerjen İkon Sistemi (SVG dosyaları)
### GÖREV 3: 3 Tema Sistemi (beyaz/siyah/kırmızı)

---

## GÖREV 1: FONT DEĞİŞİKLİĞİ

### Mevcut Durum
- Google Fonts'tan Montserrat yükleniyor (100-900 weight)
- Heading: font-weight 700
- Body: font-weight 400
- Muted/açıklamalar: font-weight 200

### Yapılacak Değişiklik
- **Başlık fontu:** Playfair Display (700 weight) — serif, premium görünüm
- **Body fontu:** Inter (400, 500 weight) — clean, modern, okunabilir

### Adımlar

1. **index.html** dosyasında Google Fonts import'unu güncelle:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
```

2. **tailwind.config.ts** veya **index.css** (hangisi font tanımlıyorsa) güncelle:
   - `font-heading` veya heading class'ları → `'Playfair Display', serif`
   - `font-body` veya body/default → `'Inter', sans-serif`
   - body default font-family → Inter
   - font-weight yapısı:
     - Başlıklar (h1-h6, card titles, section headers): Playfair Display 700
     - Body text: Inter 400
     - Açıklamalar/muted: Inter 300
     - Butonlar/label: Inter 500

3. **Tüm dosyalarda** Montserrat referanslarını ara ve değiştir:
   - CSS'te `font-family: 'Montserrat'` → uygun font
   - Tailwind class'larda `font-['Montserrat']` varsa kaldır
   - Global CSS'te body font-family güncelle

4. **Public menü sayfası** özellikle kontrol et:
   - Splash ekranı: restoran adı Playfair Display 700
   - Ürün kartları: ürün adı Playfair Display 700, açıklama Inter 400
   - Fiyat: Inter 500
   - Kategori başlıkları: Playfair Display 700

5. **Landing page** kontrol et:
   - Hero başlık: Playfair Display 700
   - Section başlıkları: Playfair Display 700
   - Body paragraflar: Inter 400
   - Buton metinleri: Inter 500

---

## GÖREV 2: ALLERJEN İKON SİSTEMİ

### Mevcut Durum
- Allerjenler DB'de `allergens` array olarak tutuluyor (menu_items tablosunda)
- Şu an Circum Icons kullanılıyor allerjenler için
- Yeni SVG ikonlar public/allergens/ klasörüne kopyalanacak

### Yaklaşım
SVG dosyalarını `public/allergens/` klasörüne koy ve `<img>` tag ile kullan. Bu yaklaşım:
- Bundle boyutunu artırmaz
- Kolay yönetilir
- Her yerde aynı şekilde kullanılır

### Adım 1: SVG dosyalarını kopyala

`public/allergens/` klasörü oluştur ve aşağıdaki dosyaları kopyala. 
Dosyalar VPS'te `/opt/khp/tabbled/allergen-icons/` konumunda olacak.

```bash
mkdir -p public/allergens
cp /opt/khp/tabbled/allergen-icons/*.svg public/allergens/
```

### Adım 2: Allerjen mapping dosyası oluştur

`src/lib/allergens.ts` dosyası oluştur:

```typescript
export interface AllergenInfo {
  key: string;
  label_tr: string;
  label_en: string;
  icon: string; // public/allergens/ altindaki dosya adi
  color: string; // badge arka plan rengi
}

export const ALLERGEN_LIST: AllergenInfo[] = [
  // === EU 14 ZORUNLU ALLERJEN ===
  { key: 'gluten', label_tr: 'Gluten', label_en: 'Gluten', icon: 'gluten-svgrepo-com.svg', color: '#D97706' },
  { key: 'milk', label_tr: 'Süt', label_en: 'Milk', icon: 'milk-svgrepo-com.svg', color: '#2563EB' },
  { key: 'eggs', label_tr: 'Yumurta', label_en: 'Eggs', icon: 'eggs-svgrepo-com.svg', color: '#F59E0B' },
  { key: 'fish', label_tr: 'Balık', label_en: 'Fish', icon: 'fish-svgrepo-com.svg', color: '#0891B2' },
  { key: 'shrimp', label_tr: 'Karides', label_en: 'Shrimp', icon: 'shrimp-svgrepo-com.svg', color: '#E11D48' },
  { key: 'crab', label_tr: 'Yengeç', label_en: 'Crab', icon: 'crab-svgrepo-com.svg', color: '#DC2626' },
  { key: 'nuts', label_tr: 'Fındık/Ceviz', label_en: 'Tree Nuts', icon: 'nuts-svgrepo-com.svg', color: '#92400E' },
  { key: 'walnut', label_tr: 'Ceviz', label_en: 'Walnut', icon: 'walnut-svgrepo-com.svg', color: '#78350F' },
  { key: 'cashew', label_tr: 'Kaju', label_en: 'Cashew', icon: 'cashew-svgrepo-com.svg', color: '#A16207' },
  { key: 'soya', label_tr: 'Soya', label_en: 'Soya', icon: 'soya-svgrepo-com.svg', color: '#65A30D' },
  { key: 'soy-bean', label_tr: 'Soya Fasulyesi', label_en: 'Soy Bean', icon: 'soy-bean-svgrepo-com.svg', color: '#4D7C0F' },
  { key: 'celery', label_tr: 'Kereviz', label_en: 'Celery', icon: 'celery-svgrepo-com.svg', color: '#16A34A' },
  { key: 'mustard', label_tr: 'Hardal', label_en: 'Mustard', icon: 'mustard-svgrepo-com.svg', color: '#CA8A04' },
  { key: 'sesame', label_tr: 'Susam', label_en: 'Sesame', icon: 'sesame-svgrepo-com.svg', color: '#B45309' },
  { key: 'sulfur-dioxide-sulphites', label_tr: 'Sülfür Dioksit', label_en: 'Sulphites', icon: 'sulfur-dioxide-sulphites-svgrepo-com.svg', color: '#7C3AED' },
  { key: 'lupine', label_tr: 'Lupin', label_en: 'Lupine', icon: 'lupine-svgrepo-com.svg', color: '#8B5CF6' },
  { key: 'wheat', label_tr: 'Buğday', label_en: 'Wheat', icon: 'wheat-svgrepo-com.svg', color: '#D97706' },

  // === DENİZ ÜRÜNLERİ ===
  { key: 'abalone', label_tr: 'Deniz Kulağı', label_en: 'Abalone', icon: 'abalone-svgrepo-com.svg', color: '#0E7490' },
  { key: 'squid', label_tr: 'Kalamar', label_en: 'Squid', icon: 'squid-svgrepo-com.svg', color: '#0369A1' },
  { key: 'matsuke', label_tr: 'Matsutake', label_en: 'Matsutake', icon: 'matsuke-svgrepo-com.svg', color: '#B45309' },

  // === ET ===
  { key: 'beef', label_tr: 'Dana Eti', label_en: 'Beef', icon: 'beef-svgrepo-com.svg', color: '#B91C1C' },
  { key: 'pork', label_tr: 'Domuz Eti', label_en: 'Pork', icon: 'pork-svgrepo-com.svg', color: '#BE185D' },

  // === MEYVELER ===
  { key: 'apple', label_tr: 'Elma', label_en: 'Apple', icon: 'apple-svgrepo-com.svg', color: '#DC2626' },
  { key: 'banana', label_tr: 'Muz', label_en: 'Banana', icon: 'banana-svgrepo-com.svg', color: '#EAB308' },
  { key: 'kiwi', label_tr: 'Kivi', label_en: 'Kiwi', icon: 'kiwi-svgrepo-com.svg', color: '#65A30D' },
  { key: 'orange', label_tr: 'Portakal', label_en: 'Orange', icon: 'orange-svgrepo-com.svg', color: '#EA580C' },
  { key: 'peach', label_tr: 'Şeftali', label_en: 'Peach', icon: 'peach-svgrepo-com.svg', color: '#F97316' },

  // === SEBZELER & DİĞER ===
  { key: 'mushroom', label_tr: 'Mantar', label_en: 'Mushroom', icon: 'mushroom-svgrepo-com.svg', color: '#78716C' },
  { key: 'potato', label_tr: 'Patates', label_en: 'Potato', icon: 'potato-svgrepo-com.svg', color: '#A16207' },
  { key: 'pepper', label_tr: 'Biber', label_en: 'Pepper', icon: 'pepper-svgrepo-com.svg', color: '#DC2626' },

  // === ÖZEL İKONLAR (allerjen değil, badge olarak kullanılacak) ===
  { key: 'vegan', label_tr: 'Vegan', label_en: 'Vegan', icon: 'vegan-icon.svg', color: '#16A34A' },
];

// Allerjen key'den bilgi getir
export function getAllergenInfo(key: string): AllergenInfo | undefined {
  return ALLERGEN_LIST.find(a => a.key === key);
}

// Allerjen ikon URL'i
export function getAllergenIconUrl(key: string): string {
  const info = getAllergenInfo(key);
  if (info) {
    return `/allergens/${info.icon}`;
  }
  return '/allergens/gluten-svgrepo-com.svg'; // fallback
}

// DB'deki allergen key'lerini AllergenInfo listesine cevir
export function getAllergenInfoList(keys: string[]): AllergenInfo[] {
  return keys
    .map(key => getAllergenInfo(key))
    .filter((info): info is AllergenInfo => info !== undefined);
}
```

### Adım 3: AllergenIcon bileşeni oluştur

`src/components/AllergenIcon.tsx` dosyası oluştur:

```tsx
import { getAllergenInfo } from '@/lib/allergens';

interface AllergenIconProps {
  allergenKey: string;
  size?: number;
  showLabel?: boolean;
  lang?: 'tr' | 'en';
  className?: string;
}

export function AllergenIcon({ allergenKey, size = 20, showLabel = false, lang = 'tr', className = '' }: AllergenIconProps) {
  const info = getAllergenInfo(allergenKey);
  if (!info) return null;

  const label = lang === 'tr' ? info.label_tr : info.label_en;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} title={label}>
      <img
        src={`/allergens/${info.icon}`}
        alt={label}
        width={size}
        height={size}
        className="flex-shrink-0"
        style={{ filter: 'none' }}
      />
      {showLabel && (
        <span className="text-xs" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>
          {label}
        </span>
      )}
    </div>
  );
}

// Birden fazla allerjen gosterimi
interface AllergenBadgeListProps {
  allergens: string[];
  size?: number;
  showLabel?: boolean;
  lang?: 'tr' | 'en';
  className?: string;
}

export function AllergenBadgeList({ allergens, size = 18, showLabel = false, lang = 'tr', className = '' }: AllergenBadgeListProps) {
  if (!allergens || allergens.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {allergens.map((key) => (
        <AllergenIcon key={key} allergenKey={key} size={size} showLabel={showLabel} lang={lang} />
      ))}
    </div>
  );
}
```

### Adım 4: Mevcut allerjen kullanımlarını güncelle

Aşağıdaki dosyalarda allerjen ikonlarını yeni sisteme geçir:

1. **RestaurantDashboard.tsx** — Ürün oluşturma/düzenleme formundaki allerjen seçicisini güncelle:
   - Mevcut Circum Icon allerjen mapping'ini `ALLERGEN_LIST` ile değiştir
   - Allerjen seçim checkbox'larının yanına `<AllergenIcon>` ekle
   - Ürün kartlarındaki allerjen gösterimini `<AllergenBadgeList>` ile değiştir

2. **PublicMenu.tsx** — Public menüdeki allerjen gösterimini güncelle:
   - Ürün kartlarında küçük allerjen ikonları (size=16)
   - Ürün detay modalında büyük allerjen ikonları + isimli (size=24, showLabel=true)

3. **Ürün detay modalı** (PublicMenu içinde veya ayrı component):
   - Allerjenler bölümünde `<AllergenBadgeList allergens={item.allergens} size={24} showLabel={true} lang={currentLang} />`

### Adım 5: DB allerjen key'lerini güncelle

Mevcut DB'deki allerjen key'leri yeni sisteme uygun olmalı. Eğer mevcut key'ler farklıysa migration gerekir. Yeni key'ler:
```
gluten, milk, eggs, fish, shrimp, crab, nuts, walnut, cashew, soya, soy-bean, 
celery, mustard, sesame, sulfur-dioxide-sulphites, lupine, wheat,
abalone, squid, matsuke, beef, pork, 
apple, banana, kiwi, orange, peach, 
mushroom, potato, pepper, vegan
```

RestaurantDashboard'daki allerjen seçim listesini de bu key'lere göre güncelle. Türkçe label'lar `ALLERGEN_LIST`'ten alınacak.

---

## GÖREV 3: 3 TEMA SİSTEMİ

### Konsept
Restoran sahibi admin panelinden menü temasını seçer. Tema sadece **public menü sayfasını** etkiler (splash + menü). Admin panel ve landing page etkilenmez.

### 3 Tema

| Tema | Anahtar | Arka Plan | Metin | Kart BG | Fiyat Rengi | Accent |
|------|---------|-----------|-------|---------|-------------|--------|
| Beyaz | `white` | `#FFFFFF` | `#111111` | `#F5F5F5` | `#111111` | `#111111` |
| Siyah | `black` | `#111111` | `#FFFFFF` | `#1F1F1F` | `#FFFFFF` | `#FFFFFF` |
| Kırmızı | `red` | `#DC2626` | `#FFFFFF` | `rgba(255,255,255,0.15)` | `#FFFFFF` | `#FFFFFF` |

### Kurallar
- Kahverengi (#422B21) tamamen kalkacak, hiçbir yerde kullanılmayacak
- Fiyat rengi = metin rengi (tema ile uyumlu)
- Minimalist, temiz tasarım
- Kart hover'da hafif gölge
- Butonlar tema accent rengiyle
- Splash ekranı da temaya uyumlu olacak

### Adımlar

#### 1. DB Güncelleme
`restaurants.theme_color` kolonu zaten var. Varsayılan değeri 'white' olarak ayarla:

```sql
ALTER TABLE restaurants ALTER COLUMN theme_color SET DEFAULT 'white';
UPDATE restaurants SET theme_color = 'white' WHERE theme_color IS NULL;
```

#### 2. Tema config dosyası oluştur

`src/lib/themes.ts`:

```typescript
export interface MenuTheme {
  key: string;
  label_tr: string;
  bg: string;
  text: string;
  cardBg: string;
  cardBorder: string;
  price: string;
  accent: string;
  mutedText: string;
  splashOverlay: string;
  badgeBg: string;
  badgeText: string;
  categoryBg: string;
  categoryActiveBg: string;
  categoryActiveText: string;
  inputBg: string;
  divider: string;
}

export const THEMES: Record<string, MenuTheme> = {
  white: {
    key: 'white',
    label_tr: 'Beyaz (Klasik)',
    bg: '#FFFFFF',
    text: '#111111',
    cardBg: '#F5F5F5',
    cardBorder: '#E5E5E5',
    price: '#111111',
    accent: '#111111',
    mutedText: '#6B7280',
    splashOverlay: 'rgba(0,0,0,0.5)',
    badgeBg: '#F3F4F6',
    badgeText: '#374151',
    categoryBg: '#F5F5F5',
    categoryActiveBg: '#111111',
    categoryActiveText: '#FFFFFF',
    inputBg: '#F9FAFB',
    divider: '#E5E5E5',
  },
  black: {
    key: 'black',
    label_tr: 'Siyah (Elegance)',
    bg: '#111111',
    text: '#FFFFFF',
    cardBg: '#1F1F1F',
    cardBorder: '#333333',
    price: '#FFFFFF',
    accent: '#FFFFFF',
    mutedText: '#9CA3AF',
    splashOverlay: 'rgba(0,0,0,0.7)',
    badgeBg: '#374151',
    badgeText: '#D1D5DB',
    categoryBg: '#1F1F1F',
    categoryActiveBg: '#FFFFFF',
    categoryActiveText: '#111111',
    inputBg: '#1F1F1F',
    divider: '#333333',
  },
  red: {
    key: 'red',
    label_tr: 'Kırmızı (Bold)',
    bg: '#DC2626',
    text: '#FFFFFF',
    cardBg: 'rgba(255,255,255,0.15)',
    cardBorder: 'rgba(255,255,255,0.25)',
    price: '#FFFFFF',
    accent: '#FFFFFF',
    mutedText: 'rgba(255,255,255,0.7)',
    splashOverlay: 'rgba(0,0,0,0.5)',
    badgeBg: 'rgba(255,255,255,0.2)',
    badgeText: '#FFFFFF',
    categoryBg: 'rgba(255,255,255,0.1)',
    categoryActiveBg: '#FFFFFF',
    categoryActiveText: '#DC2626',
    inputBg: 'rgba(255,255,255,0.1)',
    divider: 'rgba(255,255,255,0.2)',
  },
};

export function getTheme(key: string | null | undefined): MenuTheme {
  return THEMES[key || 'white'] || THEMES.white;
}
```

#### 3. PublicMenu.tsx'te tema uygula

Public menü sayfasında restaurant bilgisi yüklendiğinde tema belirle:

```typescript
import { getTheme } from '@/lib/themes';

// Restaurant verisinden tema al
const theme = getTheme(restaurant?.theme_color);

// Tüm stil referanslarında theme kullan
// Örnek:
<div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
  {/* ... */}
</div>
```

Güncellenecek alanlar:
- Ana container background ve text rengi
- Splash ekranı overlay ve buton renkleri
- Kategori tab bar renkleri
- Ürün kartı background, border, text renkleri
- Fiyat rengi
- Badge renkleri (popüler, yeni, vejetaryen)
- Allerjen ikon altındaki label renkleri
- Ürün detay modal renkleri
- "Powered by Tabbled" footer rengi
- Tüm divider/border renkleri

ÖNEMLİ: Mevcut hardcoded renkler (özellikle #422B21 kahverengi, ve diğer sabit renkler) theme objesiyle değiştirilmeli. Hiçbir yerde sabit renk kalmamalı (public menü sayfasında).

#### 4. Admin panelde tema seçici ekle

RestaurantDashboard.tsx → Profil tabına tema seçici ekle:

```tsx
// Profil tabinda, Sosyal medya bolumunun altina:
<div className="space-y-2">
  <label className="text-sm font-medium">Menü Teması</label>
  <div className="flex gap-3">
    {Object.values(THEMES).map((t) => (
      <button
        key={t.key}
        onClick={() => handleThemeChange(t.key)}
        className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${
          currentTheme === t.key ? 'border-black ring-2 ring-offset-2 ring-black' : 'border-gray-200'
        }`}
        style={{ backgroundColor: t.bg, color: t.text }}
      >
        {t.label_tr.split(' ')[0]}
      </button>
    ))}
  </div>
</div>
```

Theme değişikliğinde Supabase'e kaydet:
```typescript
const handleThemeChange = async (themeKey: string) => {
  const { error } = await supabase
    .from('restaurants')
    .update({ theme_color: themeKey })
    .eq('id', restaurantId);
  
  if (!error) {
    setCurrentTheme(themeKey);
    toast.success('Tema güncellendi');
  }
};
```

#### 5. Allerjen ikonlarının temaya uyumu

Siyah ve kırmızı temalarda allerjen SVG ikonları siyah stroke ile gelecek. Bunları beyaz yapmak için CSS filtre uygula:

```typescript
// AllergenIcon bileseninde tema destegi
const iconStyle = theme.key !== 'white' 
  ? { filter: 'invert(1) brightness(2)' } 
  : {};

<img
  src={`/allergens/${info.icon}`}
  style={iconStyle}
  // ...
/>
```

Veya daha iyi bir yaklaşım: AllergenIcon'a theme prop'u ekle.

---

## GENEL KURALLAR

1. **shadcn/ui internal Lucide ikonlarına DOKUNMA** — sadece kendi kodlarımızdaki ikonları değiştir
2. **Admin paneli ve landing page teması DEĞİŞMEZ** — tema sadece public menü sayfasını etkiler
3. **Kahverengi (#422B21) tamamen kaldırılacak** — public menüde hiçbir yerde kalmayacak
4. **TypeScript hataları olmamalı** — `npm run build` başarılı olmalı
5. **Mevcut işlevselliği bozma** — allerjen seçme, kaydetme, gösterme akışı çalışmaya devam etmeli
6. **Her değişiklik sonrası build test et:** `npm run build`

---

## SVG DOSYALARI

Aşağıdaki SVG dosyaları `/opt/khp/tabbled/allergen-icons/` klasörüne kopyalanacak, sonra `public/allergens/` altına taşınacak.

Dosya listesi (33 adet):
```
abalone-svgrepo-com.svg
apple-svgrepo-com.svg
banana-svgrepo-com.svg
beef-svgrepo-com.svg
cashew-svgrepo-com.svg
celery-svgrepo-com.svg
crab-svgrepo-com.svg
eggs-svgrepo-com.svg
fish-svgrepo-com.svg
gluten-svgrepo-com.svg
healthy-exercise-strength-workout-muscular-lifting-bodybuilding-svgrepo-com.svg
healthy-mentality-strong-health-wellness-happy-healthcare-svgrepo-com.svg
kiwi-svgrepo-com.svg
lupine-svgrepo-com.svg
matsuke-svgrepo-com.svg
milk-svgrepo-com.svg
mushroom-svgrepo-com.svg
mustard-svgrepo-com.svg
nuts-svgrepo-com.svg
orange-svgrepo-com.svg
peach-svgrepo-com.svg
pepper-svgrepo-com.svg
pork-svgrepo-com.svg
potato-svgrepo-com.svg
sesame-svgrepo-com.svg
shrimp-svgrepo-com.svg
soy-bean-svgrepo-com.svg
soya-svgrepo-com.svg
squid-svgrepo-com.svg
sulfur-dioxide-sulphites-svgrepo-com.svg
vegan-icon.svg
walnut-svgrepo-com.svg
wheat-svgrepo-com.svg
```

NOT: `Geographical_Indications_of_Turkey.svg` (77KB) kullanılmayacak.
NOT: `healthy-exercise-*` ve `healthy-mentality-*` SVG'leri allerjen değil, ileride sağlık gösterimi için kullanılabilir. Şimdilik `public/allergens/` klasörüne kopyala ama allerjen listesine ekleme.

---

## ÇALIŞTIRMA SIRASI

1. Önce SVG dosyalarını yerleştir (`public/allergens/`)
2. Font değişikliğini yap (Görev 1)
3. Allerjen sistemini oluştur (Görev 2)  
4. Tema sistemini oluştur (Görev 3)
5. `npm run build` ile test et
6. Her şey çalışıyorsa: `git add -A && git commit -m "Font: Playfair+Inter, Allergen SVG icons, 3 theme system" && git push origin main`

---

## TEST KONTROL LİSTESİ

- [ ] Font: Landing page başlıkları Playfair Display, body Inter
- [ ] Font: Public menü başlıkları Playfair Display, body Inter
- [ ] Font: Admin panel de yeni fontları kullanıyor
- [ ] Allerjen: RestaurantDashboard'da allerjen seçme yeni ikonlarla çalışıyor
- [ ] Allerjen: Public menüde allerjen ikonları SVG olarak görünüyor
- [ ] Allerjen: Ürün detay modalında allerjenler isimli gösteriliyor
- [ ] Tema: Admin panelde tema seçici var ve çalışıyor
- [ ] Tema: Beyaz tema doğru renklerde
- [ ] Tema: Siyah tema doğru renklerde
- [ ] Tema: Kırmızı tema doğru renklerde
- [ ] Tema: Allerjen ikonları her temada görünür (siyah/kırmızıda invert)
- [ ] Kahverengi (#422B21) hiçbir yerde yok
- [ ] npm run build hatasız
- [ ] Splash ekranı temaya uyumlu
