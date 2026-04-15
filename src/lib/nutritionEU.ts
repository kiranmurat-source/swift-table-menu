/**
 * AB/EU besin değerleri helper'ları
 * - Enerji: kcal ↔ kJ dönüşümü
 * - Sodyum (mg) → Tuz (g)
 * - Trafik ışığı eşikleri (UK FSA / EU regülasyonu, per 100g)
 * - Günlük referans alım (RI) değerleri
 * - Nutri-Score renk ve label sabitleri
 */

export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export const NUTRI_SCORE_COLORS: Record<NutriScore, string> = {
  A: '#038141',
  B: '#85BB2F',
  C: '#FECB02',
  D: '#EE8100',
  E: '#E63E11',
};

/** C/E üzerinde metin kontrastı için: sarı harfte koyu yazı gerekir. */
export function nutriScoreTextColor(score: NutriScore): string {
  return score === 'C' ? '#1C1C1E' : '#FFFFFF';
}

export const NUTRI_SCORE_LABELS: Record<NutriScore, { tr: string; en: string; ar: string; zh: string }> = {
  A: {
    tr: 'Çok iyi beslenme kalitesi',
    en: 'Very good nutritional quality',
    ar: 'جودة غذائية ممتازة',
    zh: '非常好的营养质量',
  },
  B: {
    tr: 'İyi beslenme kalitesi',
    en: 'Good nutritional quality',
    ar: 'جودة غذائية جيدة',
    zh: '良好的营养质量',
  },
  C: {
    tr: 'Orta beslenme kalitesi',
    en: 'Average nutritional quality',
    ar: 'جودة غذائية متوسطة',
    zh: '一般营养质量',
  },
  D: {
    tr: 'Düşük beslenme kalitesi',
    en: 'Low nutritional quality',
    ar: 'جودة غذائية منخفضة',
    zh: '营养质量较低',
  },
  E: {
    tr: 'Kötü beslenme kalitesi',
    en: 'Poor nutritional quality',
    ar: 'جودة غذائية رديئة',
    zh: '营养质量差',
  },
};

export const NUTRI_SCORE_VALUES: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];

/** kcal → kJ (1 kcal = 4.184 kJ) */
export function kcalToKj(kcal: number): number {
  return Math.round(kcal * 4.184);
}

/** Sodyum (mg) → Tuz (g): AB 1169/2011 Ek I'e göre tuz = sodyum × 2.5 */
export function sodiumToSalt(sodiumMg: number): number {
  return Number(((sodiumMg * 2.5) / 1000).toFixed(2));
}

/** AB 1169/2011 — Günlük Referans Alım (RI) değerleri (ortalama yetişkin) */
export const EU_REFERENCE_INTAKE = {
  energyKcal: 2000,
  energyKj: 8400,
  fat: 70,
  saturatedFat: 20,
  carbohydrate: 260,
  sugars: 90,
  protein: 50,
  salt: 6,
} as const;

/** RI% = (miktar / günlük RI) × 100 */
export function getRIPercent(
  nutrient: keyof typeof EU_REFERENCE_INTAKE,
  value: number | null | undefined,
): number | null {
  if (value == null) return null;
  const ri = EU_REFERENCE_INTAKE[nutrient];
  if (!ri) return null;
  return Math.round((value / ri) * 100);
}

export type TrafficLight = 'green' | 'amber' | 'red';

/** UK FSA trafik ışığı eşikleri (per 100g) */
const TRAFFIC_LIGHT_THRESHOLDS = {
  fat: { low: 3, high: 17.5 },
  saturatedFat: { low: 1.5, high: 5 },
  sugars: { low: 5, high: 22.5 },
  salt: { low: 0.3, high: 1.5 },
} as const;

export function getTrafficLight(
  nutrient: keyof typeof TRAFFIC_LIGHT_THRESHOLDS,
  value: number | null | undefined,
): TrafficLight | null {
  if (value == null) return null;
  const t = TRAFFIC_LIGHT_THRESHOLDS[nutrient];
  if (value <= t.low) return 'green';
  if (value >= t.high) return 'red';
  return 'amber';
}

export const TRAFFIC_LIGHT_COLORS: Record<TrafficLight, string> = {
  green: '#4CAF50',
  amber: '#FFC107',
  red: '#F44336',
};

/**
 * Ondalık sayı formatı — dile göre ayırıcı seçer.
 * - TR / AR / ZH: virgül (8,5)
 * - EN ve diğer: nokta (8.5)
 */
export function formatNutritionValue(value: number, locale: string, maxFractionDigits = 1): string {
  const useComma = locale === 'tr' || locale === 'ar';
  const rounded = Number(value.toFixed(maxFractionDigits));
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(maxFractionDigits);
  return useComma ? str.replace('.', ',') : str;
}
