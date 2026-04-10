// ============================================
// ALLERJEN VE DİYET TERCİHLERİ
// Sadece 14 AB zorunlu alerjen + 4 diyet tercihi
// ============================================

export interface AllergenItem {
  key: string;
  name_tr: string;
  name_en: string;
  icon: string;       // filename under public/allergens-erudus/ (without .svg)
  color: string;
  category: 'eu14' | 'diet';
}

// Keep the old name as an alias for backward compat within the project
export type AllergenInfo = AllergenItem;

// === 14 AB ZORUNLU ALERJEN (EU Regulation 1169/2011) ===
export const ALLERGEN_LIST: AllergenItem[] = [
  { key: 'cereal',       name_tr: 'Gluten (Tahıl)',           name_en: 'Cereals (Gluten)',  icon: 'circle-cereal',       color: '#D97706', category: 'eu14' },
  { key: 'milk',         name_tr: 'Süt',                      name_en: 'Milk',              icon: 'circle-milk',         color: '#2563EB', category: 'eu14' },
  { key: 'eggs',         name_tr: 'Yumurta',                  name_en: 'Eggs',              icon: 'circle-eggs',         color: '#F59E0B', category: 'eu14' },
  { key: 'fish',         name_tr: 'Balık',                    name_en: 'Fish',              icon: 'circle-fish',         color: '#0891B2', category: 'eu14' },
  { key: 'crustaceans',  name_tr: 'Kabuklu Deniz Ürünleri',   name_en: 'Crustaceans',       icon: 'circle-crustaceans',  color: '#E11D48', category: 'eu14' },
  { key: 'peanuts',      name_tr: 'Yer Fıstığı',             name_en: 'Peanuts',           icon: 'circle-peanuts',      color: '#B45309', category: 'eu14' },
  { key: 'soybeans',     name_tr: 'Soya',                     name_en: 'Soybeans',          icon: 'circle-soya',         color: '#65A30D', category: 'eu14' },
  { key: 'nuts',         name_tr: 'Sert Kabuklu Meyveler',    name_en: 'Tree Nuts',         icon: 'circle-nuts',         color: '#92400E', category: 'eu14' },
  { key: 'celery',       name_tr: 'Kereviz',                  name_en: 'Celery',            icon: 'circle-celery',       color: '#16A34A', category: 'eu14' },
  { key: 'mustard',      name_tr: 'Hardal',                   name_en: 'Mustard',           icon: 'circle-mustard',      color: '#CA8A04', category: 'eu14' },
  { key: 'sesame',       name_tr: 'Susam',                    name_en: 'Sesame',            icon: 'circle-sesame',       color: '#B45309', category: 'eu14' },
  { key: 'sulphites',    name_tr: 'Sülfür Dioksit',           name_en: 'Sulphites',         icon: 'circle-so2',          color: '#7C3AED', category: 'eu14' },
  { key: 'lupin',        name_tr: 'Acı Bakla (Lupin)',        name_en: 'Lupin',             icon: 'circle-lupin',        color: '#8B5CF6', category: 'eu14' },
  { key: 'molluscs',     name_tr: 'Yumuşakçalar',             name_en: 'Molluscs',          icon: 'circle-molluscs',     color: '#0E7490', category: 'eu14' },
];

// === DİYET TERCİHLERİ ===
export const DIET_LIST: AllergenItem[] = [
  { key: 'vegetarian',   name_tr: 'Vejetaryen',               name_en: 'Vegetarian',        icon: 'circle-vegetarian',   color: '#16A34A', category: 'diet' },
  { key: 'vegan',        name_tr: 'Vegan',                    name_en: 'Vegan',             icon: 'circle-vegan',        color: '#15803D', category: 'diet' },
  { key: 'halal',        name_tr: 'Helal',                    name_en: 'Halal',             icon: 'circle-halal',        color: '#2E7D32', category: 'diet' },
  { key: 'kosher',       name_tr: 'Koşer',                    name_en: 'Kosher',            icon: 'circle-kosher',       color: '#1565C0', category: 'diet' },
];

// Tüm listeler birleşik
export const ALL_ITEMS = [...ALLERGEN_LIST, ...DIET_LIST];

// === ESKİ KEY → YENİ KEY MAPPING (geriye dönük uyumluluk) ===
export const LEGACY_KEY_MAP: Record<string, string> = {
  gluten: 'cereal',
  dairy: 'milk',
  shellfish: 'crustaceans',
  treeNuts: 'nuts',
  tree_nuts: 'nuts',
  soy: 'soybeans',
  soya: 'soybeans',
  sulfites: 'sulphites',
  'sulfur-dioxide-sulphites': 'sulphites',
  wheat: 'cereal',
  lupine: 'lupin',
  shrimp: 'crustaceans',
  crab: 'crustaceans',
  lobster: 'crustaceans',
  abalone: 'molluscs',
  squid: 'molluscs',
  octopus: 'molluscs',
  snail: 'molluscs',
  clam: 'molluscs',
  oyster: 'molluscs',
  mussel: 'molluscs',
  hazelnut: 'nuts',
  walnut: 'nuts',
  cashew: 'nuts',
  almond: 'nuts',
  'soy-bean': 'soybeans',
};

export function normalizeAllergenKey(key: string): string {
  return LEGACY_KEY_MAP[key] ?? key;
}

// Backward-compat alias — old code imports getAllergenInfo
export function getAllergenInfo(key: string): AllergenItem | undefined {
  const normalized = normalizeAllergenKey(key);
  return ALL_ITEMS.find(a => a.key === normalized);
}

export function getAllergenByKey(key: string): AllergenItem | undefined {
  return getAllergenInfo(key);
}

export function getAllergenIconUrl(key: string): string {
  const info = getAllergenInfo(key);
  if (info) return `/allergens-erudus/${info.icon}.svg`;
  return '/allergens-erudus/circle-cereal.svg';
}

export function getAllergenInfoList(keys: string[]): AllergenItem[] {
  return keys
    .map(key => getAllergenInfo(key))
    .filter((info): info is AllergenItem => info !== undefined);
}

export function getEU14Allergens(): AllergenItem[] {
  return ALLERGEN_LIST;
}

export function getDietPreferences(): AllergenItem[] {
  return DIET_LIST;
}
