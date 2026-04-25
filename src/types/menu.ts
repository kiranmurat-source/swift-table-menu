// src/types/menu.ts
// Tabbled public menu type definitions
// PublicMenu.tsx'ten çıkarıldı — tüm tip tanımları merkezi yer

export type LangCode = string;
export type UiLangCode = 'tr' | 'en' | 'ar' | 'zh';

export interface Translations {
  [lang: string]: { name?: string; description?: string; tagline?: string };
}

export interface Restaurant {
  id: string; name: string; slug: string;
  logo_url: string | null; cover_url: string | null; cover_image_url: string | null; splash_video_url: string | null;
  address: string | null; phone: string | null; is_active: boolean;
  description_tr: string | null; tagline: string | null;
  enabled_languages: string[]; translations: Translations;
  theme_color: string | null;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
  social_whatsapp: string | null; social_google_maps: string | null;
  working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  current_plan: 'basic' | 'premium' | 'enterprise';
  plan_overrides: Record<string, boolean>;
  /** @deprecated Use hasFeature(restaurant, 'key') from @/lib/planFeatures. Field kept until cleanup migration drops DB columns. */
  feature_waiter_calls?: boolean;
  feature_cart?: boolean;
  feature_whatsapp_order?: boolean;
  feature_feedback?: boolean;
  feature_discount_codes?: boolean;
  feature_likes?: boolean;
  feature_reviews: boolean;
  feature_multi_currency?: boolean;
  base_currency: string;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  menu_view_mode: string | null;
  admin_theme: string | null;
  price_effective_date?: string | null;
  show_vat_notice?: boolean;
}

export interface MenuCategory {
  id: string; restaurant_id: string; name_tr: string; description_tr: string | null;
  sort_order: number; is_active: boolean; translations: Translations;
  image_url: string | null;
  video_url: string | null;
  parent_id: string | null;
}

export interface PeriodicDayVal { enabled?: boolean; start?: string; end?: string; all_day?: boolean }
export type PeriodicScheduleVal = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDayVal>>;

export interface PriceVariant {
  name_tr: string;
  name_en: string;
  price: number;
  calories: number | null;
}

export interface Nutrition {
  serving_size?: string;
  calories?: number;
  calories_from_fat?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carb?: number;
  dietary_fiber?: number;
  sugars?: number;
  protein?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  show_on_menu?: boolean;
}

export interface MenuItem {
  id: string; restaurant_id: string; category_id: string;
  name_tr: string; description_tr: string | null; price: number;
  image_url: string | null; video_url: string | null; is_available: boolean; is_popular: boolean;
  is_new: boolean; is_vegetarian: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  schedule_type: 'always' | 'date_range' | 'periodic';
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_periodic: PeriodicScheduleVal;
  price_variants: PriceVariant[];
  nutrition: Nutrition | null;
  nutri_score: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  prep_time: number | null;
  allergens: string[] | null; calories: number | null;
  sort_order: number; translations: Translations;
  happy_hour_active: boolean;
  happy_hour_price: number | null;
  happy_hour_label: string | null;
  happy_hour_days: string[] | null;
  happy_hour_start_time: string | null;
  happy_hour_end_time: string | null;
}

export type RecRow = { recommended_item_id: string; reason_tr: string | null; reason_en: string | null; sort_order: number };
