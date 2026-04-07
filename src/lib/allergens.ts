export interface AllergenInfo {
  key: string;
  label_tr: string;
  label_en: string;
  icon: string; // filename under public/allergens/
  color: string;
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

  // === ÖZEL İKONLAR ===
  { key: 'vegan', label_tr: 'Vegan', label_en: 'Vegan', icon: 'vegan-icon.svg', color: '#16A34A' },
];

export function getAllergenInfo(key: string): AllergenInfo | undefined {
  return ALLERGEN_LIST.find(a => a.key === key);
}

export function getAllergenIconUrl(key: string): string {
  const info = getAllergenInfo(key);
  if (info) return `/allergens/${info.icon}`;
  return '/allergens/gluten-svgrepo-com.svg';
}

export function getAllergenInfoList(keys: string[]): AllergenInfo[] {
  return keys
    .map(key => getAllergenInfo(key))
    .filter((info): info is AllergenInfo => info !== undefined);
}
