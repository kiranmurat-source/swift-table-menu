// src/lib/menuI18n.ts
// Merkezi dil sözlüğü — menu bileşenleri için
// PublicMenu.tsx'teki ana UI objesinden ayrı (o büyük refactor başka sprint)

import type { UiLangCode } from '../types/menu';

// ============================================================================
// STARTING FROM TEMPLATES (menuHelpers.ts'ten)
// Varyantlı ürün fiyat gösterimi: "X TL'den başlayan"
// ============================================================================
export const STARTING_FROM_TEMPLATES: Record<UiLangCode, string> = {
  tr: "{price}'den başlayan",
  en: 'Starting from {price}',
  ar: 'يبدأ من {price}',
  zh: '起价 {price}',
};

// ============================================================================
// NUTRI-SCORE STRINGS (NutriScoreBadge.tsx'ten)
// Dropdown başlığı, açıklama, sağlık karşılaştırma metinleri
// ============================================================================
export const NUTRI_SCORE_STRINGS: Record<string, Record<UiLangCode, string>> = {
  nutriScoreTitle:  { tr: 'Nutri-Score', en: 'Nutri-Score', ar: 'Nutri-Score', zh: 'Nutri-Score' },
  nutriScoreDesc:   { tr: 'Avrupa beslenme kalitesi skalası', en: 'European nutritional quality scale', ar: 'مقياس الجودة الغذائية الأوروبي', zh: '欧洲营养质量等级' },
  nutriScoreHealthier:  { tr: 'Daha sağlıklı', en: 'Healthier', ar: 'أصح', zh: '更健康' },
  nutriScoreLessHealthy: { tr: 'Daha az sağlıklı', en: 'Less healthy', ar: 'أقل صحة', zh: '不太健康' },
  nutriScoreDeclared:   { tr: 'İşletme tarafından beyan edilmiştir.', en: 'Declared by the establishment.', ar: 'تم التصريح من قبل المنشأة.', zh: '由商家声明。' },
};

// ============================================================================
// NUTRITION FACTS STRINGS (NutritionFactsTable.tsx'ten)
// Besin değerleri tablosu: Enerji, Yağ, Doymuş, Karbonhidrat, vb.
// ============================================================================
export const NUTRITION_STRINGS: Record<string, Record<UiLangCode, string>> = {
  nutritionTitle:      { tr: 'Besin Değerleri', en: 'Nutrition Information', ar: 'معلومات غذائية', zh: '营养信息' },
  energy:              { tr: 'Enerji', en: 'Energy', ar: 'الطاقة', zh: '能量' },
  fat:                 { tr: 'Yağ', en: 'Fat', ar: 'دهون', zh: '脂肪' },
  saturates:           { tr: 'doymuş yağ', en: 'of which saturates', ar: 'منها مشبعة', zh: '其中饱和脂肪' },
  carbs:               { tr: 'Karbonhidrat', en: 'Carbohydrate', ar: 'كربوهيدرات', zh: '碳水化合物' },
  ofWhichSugars:       { tr: 'şekerler', en: 'of which sugars', ar: 'منها سكريات', zh: '其中糖' },
  protein:             { tr: 'Protein', en: 'Protein', ar: 'البروتين', zh: '蛋白质' },
  salt:                { tr: 'Tuz', en: 'Salt', ar: 'ملح', zh: '盐' },
  per100g:             { tr: '100g başına', en: 'per 100g', ar: 'لكل 100 جم', zh: '每100克' },
  perServing:          { tr: 'Porsiyon başına', en: 'per serving', ar: 'لكل حصة', zh: '每份' },
  referenceIntakeNote: {
    tr: '*Yetişkin referans alım değerleri (8400 kJ / 2000 kcal)',
    en: '*Reference intake of an average adult (8400 kJ / 2000 kcal)',
    ar: '*القيم المرجعية لبالغ متوسط (8400 kJ / 2000 سعرة)',
    zh: '*成年人参考摄入量（8400 kJ / 2000 卡路里）',
  },
};

// ============================================================================
// FILTER STRINGS (FilterPanel.tsx'ten)
// Filtre drawer etiketleri
// ============================================================================
export const FILTER_STRINGS: Record<UiLangCode, {
  filters: string; clearAll: string; apply: string; freeFrom: string; preferences: string;
  popular: string; new: string; vegetarian: string; vegan: string; halal: string; kosher: string; showing: string; noResults: string;
}> = {
  tr: {
    filters: 'Filtreler', clearAll: 'Temizle', apply: 'Uygula',
    freeFrom: 'Alerjen İçermeyen', preferences: 'Tercihler',
    popular: 'Popüler', new: 'Yeni', vegetarian: 'Vejetaryen', vegan: 'Vegan', halal: 'Helal', kosher: 'Koşer',
    showing: 'ürün gösteriliyor', noResults: 'Filtreye uygun ürün bulunamadı',
  },
  en: {
    filters: 'Filters', clearAll: 'Clear All', apply: 'Apply',
    freeFrom: 'Free From', preferences: 'Preferences',
    popular: 'Popular', new: 'New', vegetarian: 'Vegetarian', vegan: 'Vegan', halal: 'Halal', kosher: 'Kosher',
    showing: 'items showing', noResults: 'No items match your filters',
  },
  ar: {
    filters: 'تصفية', clearAll: 'مسح الكل', apply: 'تطبيق',
    freeFrom: 'خالي من', preferences: 'التفضيلات',
    popular: 'شائع', new: 'جديد', vegetarian: 'نباتي', vegan: 'نباتي صرف', halal: 'حلال', kosher: 'كوشير',
    showing: 'عنصر معروض', noResults: 'لا توجد عناصر مطابقة',
  },
  zh: {
    filters: '筛选', clearAll: '清除全部', apply: '应用',
    freeFrom: '不含', preferences: '偏好',
    popular: '热门', new: '新品', vegetarian: '素食', vegan: '纯素', halal: '清真', kosher: '洁食',
    showing: '个项目', noResults: '没有符合条件的项目',
  },
};
