export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr', flag: '🇺🇦' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', flag: '🇻🇳' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', dir: 'ltr', flag: '🇬🇷' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', dir: 'ltr', flag: '🇷🇴' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', dir: 'ltr', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr', flag: '🇫🇮' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', dir: 'ltr', flag: '🇭🇺' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', dir: 'ltr', flag: '🇨🇿' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', dir: 'ltr', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', dir: 'ltr', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', dir: 'ltr', flag: '🇷🇸' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', dir: 'ltr', flag: '🇬🇪' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', dir: 'ltr', flag: '🇦🇿' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', dir: 'ltr', flag: '🏳️' },
];

export function getLanguage(code: string): Language | undefined {
  return AVAILABLE_LANGUAGES.find((l) => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguage(code)?.nativeName || code.toUpperCase();
}

export function isRTL(code: string): boolean {
  return getLanguage(code)?.dir === 'rtl';
}

type TranslationsMap = Record<string, Record<string, string>>;

interface ItemLike {
  name_tr?: string | null;
  name_en?: string | null;
  description_tr?: string | null;
  description_en?: string | null;
  translations?: TranslationsMap | null;
}

interface CategoryLike {
  name_tr?: string | null;
  name_en?: string | null;
  translations?: TranslationsMap | null;
}

/**
 * Calculate translation completion percent for a given language across
 * all items (name + description) and categories (name).
 */
export function calculateTranslationProgress(
  items: ItemLike[],
  categories: CategoryLike[],
  langCode: string,
): number {
  if (langCode === 'tr') return 100;

  let total = 0;
  let translated = 0;

  for (const item of items) {
    total += 2;
    // name
    if (langCode === 'en' && item.name_en && item.name_en.trim() !== '') {
      translated++;
    } else if (item.translations?.[langCode]?.name && item.translations[langCode].name.trim() !== '') {
      translated++;
    }
    // description — only count if source TR has a description
    const hasSourceDesc = !!(item.description_tr && item.description_tr.trim() !== '');
    if (!hasSourceDesc) {
      translated++; // nothing to translate → treat as done
    } else if (langCode === 'en' && item.description_en && item.description_en.trim() !== '') {
      translated++;
    } else if (
      item.translations?.[langCode]?.description &&
      item.translations[langCode].description.trim() !== ''
    ) {
      translated++;
    }
  }

  for (const cat of categories) {
    total += 1;
    if (langCode === 'en' && cat.name_en && cat.name_en.trim() !== '') {
      translated++;
    } else if (cat.translations?.[langCode]?.name && cat.translations[langCode].name.trim() !== '') {
      translated++;
    }
  }

  if (total === 0) return 100;
  return Math.round((translated / total) * 100);
}

/**
 * Resolve translated text for a field with English backward-compat fallback
 * and Turkish fallback if no translation exists.
 */
export function getTranslatedText(
  item: ItemLike | CategoryLike,
  field: 'name' | 'description',
  lang: string,
): string {
  const trKey = `${field}_tr` as 'name_tr' | 'description_tr';
  const enKey = `${field}_en` as 'name_en' | 'description_en';
  const trVal = (item as ItemLike)[trKey] ?? '';

  if (lang === 'tr') return trVal ?? '';

  if (lang === 'en') {
    const existing = (item as ItemLike)[enKey];
    if (existing && existing.trim() !== '') return existing;
  }

  const translated = item.translations?.[lang]?.[field];
  if (translated && translated.trim() !== '') return translated;

  return trVal ?? '';
}
