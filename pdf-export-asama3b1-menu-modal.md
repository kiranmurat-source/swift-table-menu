# Aşama 3B-1/3B — PDF Export: Gerçek Menü + Modal (Latin Diller)

## PROJE BAĞLAMI

Tabbled QR menü. Aşama 3A tamamlandı (altyapı + Türkçe karakter doğrulandı, çalışıyor). Bu Aşama 3B-1 — gerçek menü template ve modal UI.

**Aşama 3A'da kurulan:**
- `@react-pdf/renderer@4.5.1` ✅
- `public/fonts/Roboto-{Light,Regular,Medium,Bold}.ttf` ✅
- `src/lib/pdf/pdfSetup.ts` — font registration ✅
- `src/components/admin/pdf/TestMenuPDF.tsx` — test template (bu aşamada silinecek)
- `src/components/admin/pdf/PDFDownloadButton.tsx` — placeholder buton (bu aşamada modal ile değişecek)

**DB (Aşama 1):**
- `restaurants.price_effective_date` — fiyat geçerlilik tarihi
- `restaurants.show_vat_notice` — "KDV dahildir" göster/gizle
- `restaurants.address` — işletme adresi (zorunlu gösterim)

## AŞAMA 3B-1 HEDEFİ

**Üretilecek:**
1. Gerçek menü PDF template (kategorili, ürünlü, sayfa numaralı)
2. Detaylı modal UI (dil seçimi + 3 opsiyonel checkbox)
3. Çok dilli destek — **Latin diller** (TR, EN, DE, FR, ES, IT, NL, PT, PL, RU, vb. — Roboto destekli)
4. Yasal alanlar (tarih, KDV, adres)

**Bu aşamada YAPILMAYACAK:**
- Arapça (RTL) ve Çince (CJK) — ayrı sprint (3B-2)
- Nutri-Score (yoksa yoksa)
- Ürün görselleri (yoksa yoksa)

## ADIM 1: LATİN DİL LİSTESİ

`src/lib/pdf/pdfLanguages.ts` dosyası oluştur:

```typescript
// src/lib/pdf/pdfLanguages.ts
// PDF export için desteklenen Latin diller (Roboto yeter, RTL/CJK yok)
// Arapça ve Çince sonraki sprint'te ek font ile eklenecek

export interface PDFLanguage {
  code: string;
  nativeName: string;
  englishName: string;
}

/**
 * Roboto fontuyla doğru render edilen diller.
 * Latin alphabeleri (Türkçe, İngilizce, Almanca, Fransızca vb.) + Kiril (Rusça).
 */
export const PDF_SUPPORTED_LANGUAGES: PDFLanguage[] = [
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish' },
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish' },
  { code: 'no', nativeName: 'Norsk', englishName: 'Norwegian' },
  { code: 'da', nativeName: 'Dansk', englishName: 'Danish' },
  { code: 'fi', nativeName: 'Suomi', englishName: 'Finnish' },
  { code: 'cs', nativeName: 'Čeština', englishName: 'Czech' },
  { code: 'hu', nativeName: 'Magyar', englishName: 'Hungarian' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian' },
  { code: 'bg', nativeName: 'Български', englishName: 'Bulgarian' },
];

/**
 * PDF UI metinleri - dil bazında
 * Sadece PDF'te görünen sabit etiketler (yasal ibareler, başlıklar)
 */
export const PDF_UI_STRINGS: Record<string, {
  menuDate: string;
  vatIncluded: string;
  allergens: string;
  calories: string;
  page: string;
  poweredBy: string;
  priceEffectiveFrom: string;
}> = {
  tr: {
    menuDate: 'Menü tarihi',
    vatIncluded: 'Fiyatlar KDV dahildir.',
    allergens: 'Alerjenler',
    calories: 'kcal',
    page: 'Sayfa',
    poweredBy: 'Tabbled ile oluşturuldu',
    priceEffectiveFrom: 'Fiyatlar bu tarihten itibaren geçerlidir',
  },
  en: {
    menuDate: 'Menu date',
    vatIncluded: 'Prices include VAT.',
    allergens: 'Allergens',
    calories: 'kcal',
    page: 'Page',
    poweredBy: 'Created with Tabbled',
    priceEffectiveFrom: 'Prices effective from this date',
  },
  de: {
    menuDate: 'Menüdatum',
    vatIncluded: 'Preise inklusive MwSt.',
    allergens: 'Allergene',
    calories: 'kcal',
    page: 'Seite',
    poweredBy: 'Erstellt mit Tabbled',
    priceEffectiveFrom: 'Preise gültig ab diesem Datum',
  },
  fr: {
    menuDate: 'Date du menu',
    vatIncluded: 'TVA comprise.',
    allergens: 'Allergènes',
    calories: 'kcal',
    page: 'Page',
    poweredBy: 'Créé avec Tabbled',
    priceEffectiveFrom: 'Prix en vigueur à partir de cette date',
  },
  es: {
    menuDate: 'Fecha del menú',
    vatIncluded: 'IVA incluido.',
    allergens: 'Alérgenos',
    calories: 'kcal',
    page: 'Página',
    poweredBy: 'Creado con Tabbled',
    priceEffectiveFrom: 'Precios vigentes desde esta fecha',
  },
  it: {
    menuDate: 'Data del menu',
    vatIncluded: 'IVA inclusa.',
    allergens: 'Allergeni',
    calories: 'kcal',
    page: 'Pagina',
    poweredBy: 'Creato con Tabbled',
    priceEffectiveFrom: 'Prezzi in vigore da questa data',
  },
  ru: {
    menuDate: 'Дата меню',
    vatIncluded: 'Цены включают НДС.',
    allergens: 'Аллергены',
    calories: 'ккал',
    page: 'Страница',
    poweredBy: 'Создано с Tabbled',
    priceEffectiveFrom: 'Цены действуют с этой даты',
  },
};

/**
 * Dil fallback: desteklenmeyen dil için İngilizce'ye düş
 */
export function getPDFStrings(langCode: string) {
  return PDF_UI_STRINGS[langCode] ?? PDF_UI_STRINGS.en;
}

/**
 * Ürün adını/açıklamasını seçilen dilde getir
 * menu_items'ta name_tr, name_en, name_de gibi kolonlar var
 * Fallback: TR → EN → ilk dolu değer
 */
export function localizedField(
  item: Record<string, any>,
  baseField: 'name' | 'description',
  langCode: string
): string {
  const primary = item[`${baseField}_${langCode}`];
  if (primary) return primary;
  
  // Fallback sırası
  const fallbacks = ['tr', 'en'];
  for (const fb of fallbacks) {
    const val = item[`${baseField}_${fb}`];
    if (val) return val;
  }
  
  return '';
}
```

## ADIM 2: MENÜ PDF TEMPLATE

`src/components/admin/pdf/MenuPDF.tsx` dosyasını oluştur:

```tsx
// src/components/admin/pdf/MenuPDF.tsx
// Ana menü PDF template — kategorili, ürünlü, çok sayfalı
// Yasal yedek menü formatında (Fiyat Etiketi Yönetmeliği uyumlu)

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { registerPDFFonts } from '../../../lib/pdf/pdfSetup';
import { getPDFStrings, localizedField } from '../../../lib/pdf/pdfLanguages';

registerPDFFonts();

export interface PDFMenuItem {
  id: string;
  name_tr: string | null;
  name_en: string | null;
  [key: string]: any; // name_de, name_fr, vb.
  description_tr: string | null;
  description_en: string | null;
  price: number;
  calories: number | null;
  allergens: string[] | null;
  category_id: string;
  is_available: boolean;
  is_sold_out: boolean;
  sort_order: number;
}

export interface PDFMenuCategory {
  id: string;
  name_tr: string | null;
  name_en: string | null;
  [key: string]: any;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
}

export interface PDFRestaurant {
  id: string;
  name: string;
  address: string | null;
  price_effective_date: string | null; // YYYY-MM-DD
  show_vat_notice: boolean;
}

export interface MenuPDFProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  langCode: string;
  currency: string; // e.g. 'TRY', 'USD'
  currencySymbol: string; // e.g. '₺', '$'
  options: {
    showAllergens: boolean;
    showCalories: boolean;
    showDescription: boolean;
  };
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    padding: 40,
    paddingBottom: 70, // footer için yer
    fontSize: 11,
    color: '#1C1C1E',
  },
  // Header (sadece ilk sayfa)
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1C1C1E',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 11,
    fontWeight: 400,
    color: '#6B6B70',
    marginBottom: 12,
  },
  legalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  legalText: {
    fontSize: 10,
    fontWeight: 400,
    color: '#6B6B70',
  },
  // Category
  category: {
    marginBottom: 20,
    breakInside: 'avoid', // sayfa kesmesi kategori içinde olmasın
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1C1C1E',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    marginBottom: 12,
    width: '100%',
  },
  // Item (Format B: iki satır, ferah)
  item: {
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1C1C1E',
  },
  itemDescription: {
    fontSize: 10,
    fontWeight: 300,
    color: '#6B6B70',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 9,
    fontWeight: 400,
    color: '#6B6B70',
  },
  itemDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    marginTop: 10,
  },
  soldOut: {
    textDecoration: 'line-through',
    color: '#9B9B9E',
  },
  // Footer (her sayfa)
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    fontWeight: 400,
    color: '#9B9B9E',
  },
  pageNumber: {
    fontSize: 9,
    fontWeight: 400,
    color: '#9B9B9E',
  },
});

/**
 * Tarih formatı: 2026-04-20 → 20.04.2026
 */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Fiyat formatı: 750 → "750,00 ₺"
 */
function formatPrice(price: number, symbol: string): string {
  const formatted = price.toFixed(2).replace('.', ',');
  return `${formatted} ${symbol}`;
}

/**
 * Ürünleri kategori ID'ye göre grupla, sort_order'a göre sırala
 */
function groupItemsByCategory(
  items: PDFMenuItem[],
  categories: PDFMenuCategory[]
): Map<string, PDFMenuItem[]> {
  const map = new Map<string, PDFMenuItem[]>();
  for (const cat of categories) {
    map.set(cat.id, []);
  }
  for (const item of items) {
    if (!item.is_available) continue;
    const list = map.get(item.category_id);
    if (list) {
      list.push(item);
    }
  }
  // Her kategori içinde sort
  for (const list of map.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  return map;
}

/**
 * Alerjen array'ini dile özgü text'e çevir
 * Örn: ['milk', 'gluten'] → 'Süt, Gluten' (TR)
 * Not: Basit mapping, gerçek alerjen isimleri için allergens.ts kullanılabilir ama bu PDF için basit tutuluyor
 */
function formatAllergens(allergens: string[] | null, langCode: string): string {
  if (!allergens || allergens.length === 0) return '';
  
  // Basit mapping (v1 için yeterli, v2'de allergens.ts ile genişletilir)
  const allergenMap: Record<string, Record<string, string>> = {
    tr: {
      milk: 'Süt', gluten: 'Gluten', eggs: 'Yumurta', nuts: 'Fındık',
      peanuts: 'Yer Fıstığı', soy: 'Soya', fish: 'Balık', shellfish: 'Kabuklu',
      sesame: 'Susam', celery: 'Kereviz', mustard: 'Hardal', sulphites: 'Sülfit',
      lupin: 'Acı Bakla', molluscs: 'Yumuşakça',
    },
    en: {
      milk: 'Milk', gluten: 'Gluten', eggs: 'Eggs', nuts: 'Nuts',
      peanuts: 'Peanuts', soy: 'Soy', fish: 'Fish', shellfish: 'Shellfish',
      sesame: 'Sesame', celery: 'Celery', mustard: 'Mustard', sulphites: 'Sulphites',
      lupin: 'Lupin', molluscs: 'Molluscs',
    },
  };
  
  const langMap = allergenMap[langCode] ?? allergenMap.en;
  return allergens.map(a => langMap[a] ?? a).join(', ');
}

export function MenuPDF({ 
  restaurant, 
  categories, 
  items, 
  langCode,
  currencySymbol,
  options,
}: MenuPDFProps) {
  const strings = getPDFStrings(langCode);
  const itemsByCategory = groupItemsByCategory(items, categories);
  
  // Sadece aktif ve ürünü olan kategorileri göster
  const visibleCategories = categories
    .filter(cat => cat.is_active && (itemsByCategory.get(cat.id)?.length ?? 0) > 0)
    .sort((a, b) => a.sort_order - b.sort_order);
  
  return (
    <Document 
      title={`${restaurant.name} — Menü`} 
      author="Tabbled"
      subject="Restoran menüsü"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Header - sadece ilk render'da görünür (fixed değil) */}
        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          {restaurant.address && (
            <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
          )}
          <View style={styles.legalInfo}>
            <Text style={styles.legalText}>
              {strings.priceEffectiveFrom}: {formatDate(restaurant.price_effective_date)}
            </Text>
            {restaurant.show_vat_notice && (
              <Text style={styles.legalText}>{strings.vatIncluded}</Text>
            )}
          </View>
        </View>

        {/* Kategoriler ve ürünler */}
        {visibleCategories.map((category) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          const categoryName = localizedField(category, 'name', langCode);
          
          return (
            <View key={category.id} style={styles.category} wrap>
              <Text style={styles.categoryTitle}>{categoryName}</Text>
              <View style={styles.categoryDivider} />
              
              {categoryItems.map((item) => {
                const itemName = localizedField(item, 'name', langCode);
                const itemDesc = options.showDescription 
                  ? localizedField(item, 'description', langCode)
                  : '';
                const allergenText = options.showAllergens 
                  ? formatAllergens(item.allergens, langCode)
                  : '';
                const calorieText = options.showCalories && item.calories
                  ? `${item.calories} ${strings.calories}`
                  : '';
                
                // Meta line: "400 kcal · Alerjenler: Süt, Gluten"
                const metaParts: string[] = [];
                if (calorieText) metaParts.push(calorieText);
                if (allergenText) metaParts.push(`${strings.allergens}: ${allergenText}`);
                const metaLine = metaParts.join(' · ');
                
                return (
                  <View key={item.id} style={styles.item} wrap={false}>
                    <View style={styles.itemHeader}>
                      <Text style={[
                        styles.itemName, 
                        item.is_sold_out ? styles.soldOut : {},
                      ]}>
                        {itemName}
                      </Text>
                      <Text style={[
                        styles.itemPrice, 
                        item.is_sold_out ? styles.soldOut : {},
                      ]}>
                        {formatPrice(item.price, currencySymbol)}
                      </Text>
                    </View>
                    {itemDesc && (
                      <Text style={styles.itemDescription}>{itemDesc}</Text>
                    )}
                    {metaLine && (
                      <Text style={styles.itemMeta}>{metaLine}</Text>
                    )}
                    <View style={styles.itemDivider} />
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Footer - her sayfada görünür */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {strings.poweredBy} · tabbled.com
          </Text>
          <Text 
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => 
              `${strings.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
```

## ADIM 3: PDF İNDİRME MODAL'I

`src/components/admin/pdf/PDFDownloadModal.tsx` dosyasını oluştur:

```tsx
// src/components/admin/pdf/PDFDownloadModal.tsx
// PDF indir modal — dil seçimi + opsiyonel checkbox'lar

import { useState } from 'react';
import { X, Download, FilePdf } from '@phosphor-icons/react';
import { PDF_SUPPORTED_LANGUAGES } from '../../../lib/pdf/pdfLanguages';
import type { PDFMenuCategory, PDFMenuItem, PDFRestaurant } from './MenuPDF';

export interface PDFDownloadOptions {
  langCode: string;
  showAllergens: boolean;
  showCalories: boolean;
  showDescription: boolean;
}

interface PDFDownloadModalProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  currency: string;
  currencySymbol: string;
  defaultLangCode?: string;
  onClose: () => void;
}

export function PDFDownloadModal({
  restaurant,
  categories,
  items,
  currency,
  currencySymbol,
  defaultLangCode = 'tr',
  onClose,
}: PDFDownloadModalProps) {
  const [langCode, setLangCode] = useState<string>(defaultLangCode);
  const [showAllergens, setShowAllergens] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Lazy import — PDF modülü sadece İndir butonuna basılınca yüklenir
      const [{ pdf }, { MenuPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./MenuPDF'),
      ]);

      const blob = await pdf(
        <MenuPDF
          restaurant={restaurant}
          categories={categories}
          items={items}
          langCode={langCode}
          currency={currency}
          currencySymbol={currencySymbol}
          options={{
            showAllergens,
            showCalories,
            showDescription,
          }}
        />
      ).toBlob();

      // Dosya adı: "Ramada-Encore-Bayrampasa-menu-2026-04-20.pdf"
      const safeName = restaurant.name
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '');
      const today = new Date().toISOString().slice(0, 10);
      const filename = `${safeName}-menu-${today}.pdf`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Başarılı, modal'ı kapat
      onClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(
        'PDF oluşturulurken hata oluştu: ' +
          (err instanceof Error ? err.message : 'Bilinmeyen hata')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          maxWidth: 440,
          width: '100%',
          padding: 24,
          fontFamily: 'Roboto, sans-serif',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FilePdf size={22} weight="thin" color="#1C1C1E" />
            <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: '#1C1C1E' }}>
              Menü PDF İndir
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} weight="thin" color="#6B6B70" />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#6B6B70', margin: '0 0 20px', lineHeight: 1.5 }}>
          Yasal yedek menü olarak kullanabileceğiniz PDF dosyasını oluşturun.
        </p>

        {/* Dil seçimi */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1C1C1E',
              marginBottom: 6,
            }}
          >
            Dil
          </label>
          <select
            value={langCode}
            onChange={(e) => setLangCode(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              fontFamily: 'Roboto, sans-serif',
              border: '1px solid #E5E5E5',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#1C1C1E',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {PDF_SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.englishName})
              </option>
            ))}
          </select>
        </div>

        {/* Opsiyonel içerikler */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#1C1C1E',
              marginBottom: 10,
            }}
          >
            İçerik Seçenekleri
          </label>
          
          {[
            { key: 'description', label: 'Ürün açıklaması', state: showDescription, setter: setShowDescription },
            { key: 'allergens', label: 'Alerjen bilgileri', state: showAllergens, setter: setShowAllergens },
            { key: 'calories', label: 'Kalori bilgisi', state: showCalories, setter: setShowCalories },
          ].map((opt) => (
            <label
              key={opt.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={opt.state}
                onChange={(e) => opt.setter(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  accentColor: '#1C1C1E',
                }}
              />
              <span style={{ fontSize: 14, color: '#1C1C1E' }}>{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Zorunlu bilgi kutusu */}
        <div
          style={{
            background: '#F9F9FA',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6B70', lineHeight: 1.5 }}>
            PDF'te şunlar zorunlu olarak yer alır: işletme adı, adres, menü tarihi, fiyatlar,
            KDV bildirimi (ayarlardan yönetilir).
          </div>
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              background: '#FFFFFF',
              color: '#1C1C1E',
              border: '1px solid #E5E5E5',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            İptal
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              background: loading ? '#D1D1D6' : '#1C1C1E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <Download size={16} weight="thin" />
            {loading ? 'Oluşturuluyor...' : 'PDF İndir'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## ADIM 4: ESKİ TEST BİLEŞENLERİNİ KALDIR

Aşama 3A'da oluşturulan test dosyalarını temizle:

```bash
rm /opt/khp/tabbled/src/components/admin/pdf/TestMenuPDF.tsx
```

`PDFDownloadButton.tsx`'i **güncelle** — artık modal açacak:

```tsx
// src/components/admin/pdf/PDFDownloadButton.tsx
// Menü tab'ında görünen buton — tıklandığında PDF indirme modal'ını açar

import { useState } from 'react';
import { FilePdf } from '@phosphor-icons/react';
import { PDFDownloadModal } from './PDFDownloadModal';
import type { PDFMenuCategory, PDFMenuItem, PDFRestaurant } from './MenuPDF';

interface PDFDownloadButtonProps {
  restaurant: PDFRestaurant;
  categories: PDFMenuCategory[];
  items: PDFMenuItem[];
  currency: string;
  currencySymbol: string;
  defaultLangCode?: string;
}

export function PDFDownloadButton(props: PDFDownloadButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'Roboto, sans-serif',
          background: '#1C1C1E',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <FilePdf size={16} weight="thin" />
        PDF İndir
      </button>

      {modalOpen && (
        <PDFDownloadModal
          {...props}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
```

## ADIM 5: RESTAURANTDASHBOARD ENTEGRASYONU

`src/pages/RestaurantDashboard.tsx`'te mevcut `PDFDownloadButton` çağrısını güncellemelisin. Şu an muhtemelen:

```tsx
<PDFDownloadButton restaurantName={restaurant.name} />
```

şeklinde. Bunu **gerçek menü verisiyle** değiştir:

```tsx
<PDFDownloadButton
  restaurant={{
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    price_effective_date: restaurant.price_effective_date ?? null,
    show_vat_notice: restaurant.show_vat_notice ?? true,
  }}
  categories={categories}
  items={menuItems}
  currency="TRY"
  currencySymbol="₺"
  defaultLangCode="tr"
/>
```

**DİKKAT:** Değişken isimleri (`categories`, `menuItems`) dosyadaki gerçek state isimlerine göre değişebilir. Büyük olasılıkla RestaurantDashboard.tsx'te:
- `categories` state'i var (menu_categories'dan fetch edilen)
- `menuItems` veya `items` state'i var (menu_items'dan fetch edilen)

Kontrol komutu:
```bash
grep -n "useState<.*MenuCategory\|useState<.*MenuItem\|useState<.*\[\]>" src/pages/RestaurantDashboard.tsx | head -10
```

Bu çıktıdan gerçek state isimlerini görebilirsin.

Ayrıca `restaurant` objesi zaten mevcut — sadece yeni alanları (address, price_effective_date, show_vat_notice) prop olarak geçir.

## ADIM 6: CURRENCY SYMBOL MANTIĞI

Memory'de: "Multi-Currency: 18 para birimi, TCMB kuru, seçici dropdown".

PDF şu an sadece TRY destekler. Çoklu para birimi PDF'e ileride (3B-3) eklenebilir. Bu aşamada **her zaman TRY (₺)** kullan — `currency="TRY"`, `currencySymbol="₺"` hardcoded.

## TEST CHECKLIST

### Build testi
1. `npm run build` çalıştır
2. Tüm TypeScript hataları çözülmeli
3. Lazy loading hala çalışıyor olmalı (react-pdf ayrı chunk'ta)

### Production test
1. Commit + push:
   ```bash
   git add src/lib/pdf/pdfLanguages.ts \
           src/components/admin/pdf/MenuPDF.tsx \
           src/components/admin/pdf/PDFDownloadModal.tsx \
           src/components/admin/pdf/PDFDownloadButton.tsx \
           src/pages/RestaurantDashboard.tsx
   
   # TestMenuPDF.tsx silindiyse:
   git add -A
   
   git commit -m "feat(pdf): Phase 3B-1 — real menu template + download modal (Latin languages)"
   git push git@github.com:kiranmurat-source/swift-table-menu.git main
   ```

2. Deploy bekle, test:
   - Admin → Menü Yönetimi → Menü tab'ı
   - "Kategoriler" başlığının yanında **"PDF İndir"** butonu (artık "Test" yazmıyor)
   - Butona tıkla → modal açılır
   - Dil dropdown: 20 Latin dil
   - 3 checkbox (ürün açıklaması, alerjen, kalori) — default işaretli
   - "PDF İndir" butonuna tıkla → indir

3. **İndirilen PDF'i aç ve kritik kontroller:**
   - ✅ İlk sayfa: Restoran adı ("Ramada Encore by Wyndham Bayrampaşa"), adres, fiyat tarihi, KDV notu
   - ✅ Kategoriler sıralı ve tam (Başlangıçlar, Ana Yemekler vb.)
   - ✅ Her ürün: isim, fiyat (sağ), açıklama (altta gri), alerjen + kalori meta line
   - ✅ Sayfalandırma çalışıyor (2-3 sayfa beklenir)
   - ✅ Footer her sayfada: "Tabbled ile oluşturuldu · tabbled.com | Sayfa N/M"
   - ✅ Sold out ürünler üstüne çizili
   - ✅ Türkçe karakterler doğru

4. **Farklı dil testi:**
   - Modal'da İngilizce seç → indir
   - PDF'te ürün isimleri İngilizce (name_en) gözükmeli
   - Fallback test: eğer bir ürünün name_en yoksa Türkçe gözükmeli

5. **Checkbox testi:**
   - Alerjen checkbox'ı kaldır, tekrar indir → alerjenler olmayan PDF
   - Kalori checkbox'ı kaldır, tekrar indir → kaloriler olmayan PDF

## BAŞARI KRİTERLERİ

- ✅ Build temiz, TypeScript hatasız
- ✅ Modal açılıyor, 20 dil dropdown'da
- ✅ Opsiyonel checkbox'lar çalışıyor
- ✅ PDF doğru render ediliyor (Türkçe + diğer Latin diller)
- ✅ Zorunlu yasal alanlar görünüyor (adres, tarih, KDV)
- ✅ Sayfa numaraları + footer doğru
- ✅ Lazy loading devam ediyor (ana bundle şişmedi)

## HATA DURUMLARI

- **"Cannot read property 'name_de' of undefined"** → menu_items'ta `name_de` kolonu yok. `localizedField()` fallback ile sorun çıkarmamalı ama bir ürünün hiç dil alanı yoksa boş string döner. Bu normal.
- **Modal açılmıyor** → `PDFDownloadButton.tsx`'teki state logic'i kontrol et, `useState<boolean>(false)` default olmalı
- **"Failed to fetch font"** → Public path'lerde font dosyası yok. Tekrar kontrol et: `/fonts/Roboto-*.ttf` accessible mi
- **PDF çok uzun** → Normal, Ramada Encore 77 ürünlü, muhtemelen 3-4 sayfa. Breakout kontrolü için test et
- **Sayfa numarası görünmüyor** → `<Text render={({pageNumber, totalPages}) => ...} />` pattern'i sadece `fixed` View içinde çalışır. Footer'da `fixed` attribute var mı kontrol et

HERHANGİ BİR HATA DURUMUNDA DURDUR, raporla, yeni prompt bekle.

## ÖNCELİK SIRASI

1. `pdfLanguages.ts` oluştur (dil listesi + UI strings)
2. `MenuPDF.tsx` oluştur (gerçek menü template)
3. `PDFDownloadModal.tsx` oluştur (dil seçimi + checkbox)
4. `PDFDownloadButton.tsx` güncelle (modal açacak)
5. `TestMenuPDF.tsx` sil
6. RestaurantDashboard.tsx'te PDFDownloadButton çağrısını güncelle (gerçek data ile)
7. Build → commit → push
8. Production test
9. Aşama 3B-1 BİTTİ — başarılıysa PDF Export tamamlandı
