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

export interface PDFStrings {
  menuDate: string;
  vatIncluded: string;
  allergens: string;
  calories: string;
  page: string;
  poweredBy: string;
  priceEffectiveFrom: string;
}

/**
 * PDF UI metinleri - dil bazında
 * Sadece PDF'te görünen sabit etiketler (yasal ibareler, başlıklar)
 */
export const PDF_UI_STRINGS: Record<string, PDFStrings> = {
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
export function getPDFStrings(langCode: string): PDFStrings {
  return PDF_UI_STRINGS[langCode] ?? PDF_UI_STRINGS.en;
}

/**
 * Tabbled DB şeması: name_tr / name_en kolonları + translations JSON
 * (translations[langCode] = { name?, description? })
 * Fallback sırası: langCode → tr → en
 */
export function localizedField(
  item: {
    name_tr?: string | null;
    name_en?: string | null;
    description_tr?: string | null;
    description_en?: string | null;
    translations?: Record<string, { name?: string; description?: string }> | null;
  },
  baseField: 'name' | 'description',
  langCode: string
): string {
  if (langCode === 'tr') {
    const v = item[`${baseField}_tr` as const];
    if (v) return v;
  }
  if (langCode === 'en') {
    const v = item[`${baseField}_en` as const];
    if (v) return v;
  }
  const tr = item.translations?.[langCode]?.[baseField];
  if (tr) return tr;

  // Fallback sırası
  return (
    item[`${baseField}_tr` as const] ||
    item[`${baseField}_en` as const] ||
    ''
  );
}
