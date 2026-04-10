import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import {
  Star, AppleLogo, Thermometer, MapPin, Phone, Globe,
  ForkKnife, XCircle, Funnel, Timer, SquaresFour, ListBullets, Tag, Heart, Clock,
} from "@phosphor-icons/react";
import { AllergenBadgeList } from '../components/AllergenIcon';
import { getTheme, type MenuTheme } from '../lib/themes';
import { getAllergenInfo, ALLERGEN_LIST, DIET_LIST } from '../lib/allergens';
import PromoPopup, { isPromoVisible, type Promo } from '../components/PromoPopup';
import { getLanguage, isRTL } from '../lib/languages';
import { stripHtml } from '../lib/html';
import AnimatedLogo from '../components/AnimatedLogo';
import WaiterCallBar from '../components/WaiterCallBar';
import { useCart } from '../lib/useCart';
import QuantitySelector from '../components/QuantitySelector';
import CartBottomBar from '../components/CartBottomBar';
import CartDrawer from '../components/CartDrawer';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LangCode = string;
type UiLangCode = 'tr' | 'en' | 'ar' | 'zh';

// Map an arbitrary language code to the closest built-in UI language.
// Only tr/en/ar/zh have hardcoded UI strings; everything else falls back to en.
function toUiLang(lang: string): UiLangCode {
  if (lang === 'tr' || lang === 'en' || lang === 'ar' || lang === 'zh') return lang;
  return 'en';
}

interface Translations {
  [lang: string]: { name?: string; description?: string; tagline?: string };
}

interface Restaurant {
  id: string; name: string; slug: string;
  logo_url: string | null; cover_url: string | null; cover_image_url: string | null;
  address: string | null; phone: string | null; is_active: boolean;
  description_tr: string | null; tagline: string | null;
  enabled_languages: string[]; translations: Translations;
  theme_color: string | null;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
  social_whatsapp: string | null; social_google_maps: string | null;
  working_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  feature_waiter_calls: boolean;
  feature_cart: boolean;
  feature_whatsapp_order: boolean;
  feature_feedback: boolean;
  feature_discount_codes: boolean;
  google_place_id: string | null;
}

interface MenuCategory {
  id: string; restaurant_id: string; name_tr: string; description_tr: string | null;
  sort_order: number; is_active: boolean; translations: Translations;
  image_url: string | null;
  parent_id: string | null;
}

interface PeriodicDayVal { enabled?: boolean; start?: string; end?: string; all_day?: boolean }
type PeriodicScheduleVal = Partial<Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', PeriodicDayVal>>;

interface PriceVariant {
  name_tr: string;
  name_en: string;
  price: number;
  calories: number | null;
}

interface Nutrition {
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

interface MenuItem {
  id: string; restaurant_id: string; category_id: string;
  name_tr: string; description_tr: string | null; price: number;
  image_url: string | null; is_available: boolean; is_popular: boolean;
  is_new: boolean; is_vegetarian: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  schedule_type: 'always' | 'date_range' | 'periodic';
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_periodic: PeriodicScheduleVal;
  price_variants: PriceVariant[];
  nutrition: Nutrition | null;
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

function hasVariants(item: MenuItem): boolean {
  return Array.isArray(item.price_variants) && item.price_variants.length > 0;
}

function minVariantPrice(item: MenuItem): number {
  if (!hasVariants(item)) return Number(item.price);
  return Math.min(...item.price_variants.map((v) => Number(v.price)));
}

function formatPriceDisplay(item: MenuItem, uiLang: UiLangCode): string {
  if (hasVariants(item)) {
    const min = minVariantPrice(item).toFixed(2);
    const template = UI.startingFrom[uiLang] || UI.startingFrom.en;
    return template.replace('{price}', min);
  }
  return `${Number(item.price).toFixed(2)} ₺`;
}

function variantDisplayName(v: PriceVariant, lang: LangCode): string {
  if (lang === 'en') return v.name_en?.trim() || v.name_tr;
  if (lang === 'tr') return v.name_tr;
  // Other languages: prefer EN, fallback TR
  return v.name_en?.trim() || v.name_tr;
}

function isItemVisibleBySchedule(item: MenuItem, now: Date = new Date()): boolean {
  if (!item.schedule_type || item.schedule_type === 'always') return true;
  if (item.schedule_type === 'date_range') {
    const start = item.schedule_start ? new Date(item.schedule_start) : null;
    const end = item.schedule_end ? new Date(item.schedule_end) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  }
  if (item.schedule_type === 'periodic') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const today = days[now.getDay()];
    const d = item.schedule_periodic?.[today];
    if (!d || !d.enabled) return false;
    if (d.all_day) return true;
    if (!d.start || !d.end) return true;
    const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return cur >= d.start && cur <= d.end;
  }
  return true;
}

function isHappyHourActive(item: MenuItem): boolean {
  if (!item.happy_hour_active) return false;
  if (!item.happy_hour_start_time || !item.happy_hour_end_time) return false;

  const now = new Date();

  // Day check
  if (item.happy_hour_days && item.happy_hour_days.length > 0) {
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = dayMap[now.getDay()];
    if (!item.happy_hour_days.includes(today)) return false;
  }

  // Time check
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = item.happy_hour_start_time.split(':').map(Number);
  const [endH, endM] = item.happy_hour_end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Midnight-crossing range (e.g. 22:00-02:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

const HH_DISCOUNT_LABEL: Record<UiLangCode, string> = {
  tr: 'indirim', en: 'off', ar: 'خصم', zh: '折扣',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function t(
  translations: Translations | null | undefined,
  field: string,
  fallback: string | null | undefined,
  lang: LangCode,
  englishFallback?: string | null,
): string {
  if (lang === 'tr') return fallback ?? '';
  if (lang === 'en' && englishFallback && englishFallback.trim() !== '') {
    return englishFallback;
  }
  const val = translations?.[lang]?.[field as keyof Translations[string]];
  if (val && typeof val === 'string' && val.trim() !== '') return val;
  return fallback ?? '';
}

const FILTER_ALLERGEN_KEYS = [
  'cereal', 'milk', 'eggs', 'fish', 'crustaceans', 'peanuts', 'soybeans', 'nuts',
  'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
];

const FILTER_LABELS: Record<UiLangCode, {
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

const UI: Record<string, Record<UiLangCode, string>> = {
  all:          { tr: 'Tümü', en: 'All', ar: 'الكل', zh: '全部' },
  loading:      { tr: 'Menü yükleniyor...', en: 'Loading menu...', ar: 'جاري تحميل القائمة...', zh: '菜单加载中...' },
  notFound:     { tr: 'Bu menü mevcut değil', en: 'This menu does not exist', ar: 'هذه القائمة غير موجودة', zh: '此菜单不存在' },
  noItems:      { tr: 'Menü henüz hazırlanıyor', en: 'Menu is being prepared', ar: 'القائمة قيد الإعداد', zh: '菜单正在准备中' },
  noItemsInCat: { tr: 'Bu kategoride ürün bulunmuyor', en: 'No items in this category', ar: 'لا توجد عناصر في هذه الفئة', zh: '此类别中没有项目' },
  popular:      { tr: 'Popüler', en: 'Popular', ar: 'شائع', zh: '热门' },
  newItem:      { tr: 'Yeni', en: 'New', ar: 'جديد', zh: '新品' },
  vegetarian:   { tr: 'Vejetaryen', en: 'Vegetarian', ar: 'نباتي', zh: '素食' },
  table:        { tr: 'Masa', en: 'Table', ar: 'طاولة', zh: '桌号' },
  other:        { tr: 'Diğer', en: 'Other', ar: 'أخرى', zh: '其他' },
  viewMenu:     { tr: 'Menüyü Görüntüle', en: 'View Menu', ar: 'عرض القائمة', zh: '查看菜单' },
  allergens:    { tr: 'Alerjenler', en: 'Allergens', ar: 'مسببات الحساسية', zh: '过敏原' },
  startingFrom: { tr: "{price} ₺'den başlayan", en: 'Starting from {price} ₺', ar: 'يبدأ من {price} ₺', zh: '起价 {price} ₺' },
  sizeOptions:  { tr: 'Boyut Seçenekleri', en: 'Size Options', ar: 'خيارات الحجم', zh: '规格选项' },
  soldOut:      { tr: 'Tükendi', en: 'Sold Out', ar: 'نفد', zh: '售罄' },
  nutritionTitle:   { tr: 'Besin Değerleri', en: 'Nutrition Facts', ar: 'القيم الغذائية', zh: '营养成分' },
  servingSize:      { tr: 'Porsiyon', en: 'Serving', ar: 'الحصة', zh: '份量' },
  calories:         { tr: 'Kalori', en: 'Calories', ar: 'السعرات', zh: '卡路里' },
  caloriesFromFat:  { tr: 'Yağdan', en: 'From Fat', ar: 'من الدهون', zh: '来自脂肪' },
  totalFat:         { tr: 'Toplam Yağ', en: 'Total Fat', ar: 'الدهون', zh: '总脂肪' },
  saturatedFat:     { tr: 'Doymuş Yağ', en: 'Saturated Fat', ar: 'دهون مشبعة', zh: '饱和脂肪' },
  transFat:         { tr: 'Trans Yağ', en: 'Trans Fat', ar: 'دهون متحولة', zh: '反式脂肪' },
  cholesterol:      { tr: 'Kolesterol', en: 'Cholesterol', ar: 'الكوليسترول', zh: '胆固醇' },
  sodium:           { tr: 'Sodyum', en: 'Sodium', ar: 'الصوديوم', zh: '钠' },
  totalCarb:        { tr: 'Toplam Karbonhidrat', en: 'Total Carbohydrate', ar: 'الكربوهيدرات', zh: '总碳水化合物' },
  dietaryFiber:     { tr: 'Lif', en: 'Dietary Fiber', ar: 'الألياف', zh: '膳食纤维' },
  sugars:           { tr: 'Şeker', en: 'Sugars', ar: 'السكريات', zh: '糖' },
  protein:          { tr: 'Protein', en: 'Protein', ar: 'البروتين', zh: '蛋白质' },
  vitaminA:         { tr: 'A Vitamini', en: 'Vitamin A', ar: 'فيتامين أ', zh: '维生素A' },
  vitaminC:         { tr: 'C Vitamini', en: 'Vitamin C', ar: 'فيتامين ج', zh: '维生素C' },
  calcium:          { tr: 'Kalsiyum', en: 'Calcium', ar: 'الكالسيوم', zh: '钙' },
  iron:             { tr: 'Demir', en: 'Iron', ar: 'الحديد', zh: '铁' },
  dailyValue:       {
    tr: '* % Günlük Referans Değer (2000 kcal diyete göre)',
    en: '* % Daily Value (based on 2,000 calorie diet)',
    ar: '* % القيمة اليومية (بناءً على نظام 2000 سعرة)',
    zh: '* % 每日参考值（基于2000卡路里饮食）',
  },
  prepTime:         { tr: 'Hazırlanma Süresi', en: 'Prep Time', ar: 'وقت التحضير', zh: '准备时间' },
  minutes:          { tr: 'dk', en: 'min', ar: 'دقيقة', zh: '分钟' },
  // Cart
  viewCart:          { tr: 'Sepeti Gör', en: 'View Cart', ar: 'عرض السلة', zh: '查看购物车' },
  yourCart:          { tr: 'Sepetiniz', en: 'Your Cart', ar: 'سلتك', zh: '你的购物车' },
  addToCart:         { tr: 'Sepete Ekle', en: 'Add to Cart', ar: 'أضف إلى السلة', zh: '加入购物车' },
  updateCart:        { tr: 'Sepeti Güncelle', en: 'Update Cart', ar: 'تحديث السلة', zh: '更新购物车' },
  emptyCart:         { tr: 'Boşalt', en: 'Clear', ar: 'إفراغ', zh: '清空' },
  emptyCartConfirm: { tr: 'Sepeti boşaltmak istediğinize emin misiniz?', en: 'Are you sure you want to clear the cart?', ar: 'هل أنت متأكد من إفراغ السلة؟', zh: '确定要清空购物车吗？' },
  cartEmpty:        { tr: 'Sepetiniz boş', en: 'Your cart is empty', ar: 'سلتك فارغة', zh: '购物车为空' },
  addNote:          { tr: 'Not ekleyin...', en: 'Add a note...', ar: 'أضف ملاحظة...', zh: '添加备注...' },
  notePlaceholder:  { tr: 'ör: Alerjim var, sosları ayrı', en: 'e.g. allergies, sauce on side', ar: 'مثال: حساسية، الصلصة جانبية', zh: '例如：过敏，酱料分开' },
  cartTotal:        { tr: 'Toplam', en: 'Total', ar: 'المجموع', zh: '合计' },
  cartItems:        { tr: 'ürün', en: 'items', ar: 'عنصر', zh: '项' },
  addedToCart:      { tr: 'Sepete eklendi', en: 'Added to cart', ar: 'تمت الإضافة', zh: '已加入购物车' },
  selectVariant:    { tr: 'Seçenek seçin', en: 'Select option', ar: 'اختر خيارًا', zh: '选择规格' },
  sendWhatsApp:     { tr: 'WhatsApp ile Gönder', en: 'Send via WhatsApp', ar: 'أرسل عبر واتساب', zh: '通过WhatsApp发送' },
  whatsappNA:       { tr: 'Bu restoran henüz WhatsApp siparişi kabul etmiyor', en: 'This restaurant does not accept WhatsApp orders yet', ar: 'هذا المطعم لا يقبل طلبات واتساب بعد', zh: '该餐厅暂不接受WhatsApp订单' },
  // Like & Review
  like:              { tr: 'Beğen', en: 'Like', ar: 'إعجاب', zh: '点赞' },
  liked:             { tr: 'Beğendiniz', en: 'Liked', ar: 'أعجبك', zh: '已点赞' },
  reviewPromptTitle: { tr: 'Teşekkürler!', en: 'Thank you!', ar: '!شكراً', zh: '谢谢！' },
  reviewPromptText:  { tr: "Google Maps'te de yorum bırakmak ister misiniz?", en: 'Would you like to leave a review on Google Maps?', ar: 'هل ترغب في ترك تعليق على خرائط جوجل؟', zh: '您想在Google地图上留下评论吗？' },
  reviewButton:      { tr: "Google'da Yorum Yap", en: 'Review on Google', ar: 'تقييم على جوجل', zh: '在Google上评价' },
  notNow:            { tr: 'Şimdi değil', en: 'Not now', ar: 'ليس الآن', zh: '以后再说' },
  // Discount
  enterDiscountCode:  { tr: 'İndirim kodu girin...', en: 'Enter discount code...', ar: '...أدخل رمز الخصم', zh: '请输入折扣码...' },
  applyCode:          { tr: 'Uygula', en: 'Apply', ar: 'تطبيق', zh: '应用' },
  invalidCode:        { tr: 'Geçersiz indirim kodu', en: 'Invalid discount code', ar: 'رمز خصم غير صالح', zh: '无效的折扣码' },
  codeExpired:        { tr: 'Bu kodun süresi dolmuş', en: 'This code has expired', ar: 'انتهت صلاحية هذا الرمز', zh: '此折扣码已过期' },
  codeInactive:       { tr: 'Bu kod artık geçerli değil', en: 'This code is no longer valid', ar: 'هذا الرمز لم يعد صالحاً', zh: '此折扣码已失效' },
  codeNotYetActive:   { tr: 'Bu kod henüz aktif değil', en: 'This code is not yet active', ar: 'هذا الرمز ليس نشطاً بعد', zh: '此折扣码尚未生效' },
  codeLimitReached:   { tr: 'Bu kod kullanım limitine ulaşmış', en: 'This code has reached its usage limit', ar: 'وصل هذا الرمز لحد الاستخدام', zh: '此折扣码已达使用上限' },
  minOrderRequired:   { tr: 'Minimum sipariş tutarı:', en: 'Minimum order amount:', ar: ':الحد الأدنى للطلب', zh: '最低订单金额：' },
  percentOff:         { tr: 'indirim', en: 'off', ar: 'خصم', zh: '折扣' },
  discountApplied:    { tr: 'uygulandı', en: 'applied', ar: 'مطبّق', zh: '已应用' },
};

/* ------------------------------------------------------------------ */
/*  Social Media SVG Icons                                             */
/* ------------------------------------------------------------------ */

const SocialIcon = ({ type, size = 20 }: { type: string; size?: number }) => {
  const s = { width: size, height: size, fill: 'currentColor' };
  switch (type) {
    case 'instagram': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    );
    case 'facebook': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.124-5.864 10.124-11.854z"/></svg>
    );
    case 'x': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    );
    case 'tiktok': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    );
    case 'website': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
    );
    case 'whatsapp': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    );
    case 'google_maps': return (
      <svg viewBox="0 0 24 24" {...s}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    );
    default: return null;
  }
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const table = searchParams.get('table');
  const langParam: LangCode = searchParams.get('lang') || 'tr';

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [scrollActiveCategory, setScrollActiveCategory] = useState<string | null>(null);
  const isScrollingToCategory = useRef(false);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [activePromo, setActivePromo] = useState<Promo | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const cart = useCart();

  // Like & Google Review
  const likeStorageKey = `liked_${restaurant?.id}`;
  const [liked, setLiked] = useState(() => {
    try { return sessionStorage.getItem(`liked_${slug}`) === 'true'; } catch { return false; }
  });
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    try { sessionStorage.setItem(`liked_${slug}`, 'true'); } catch {}
    if (restaurant?.google_place_id) {
      setTimeout(() => setShowReviewPrompt(true), 600);
    }
  };

  const theme = useMemo<MenuTheme>(() => getTheme(restaurant?.theme_color), [restaurant?.theme_color]);

  const lang: LangCode = useMemo(() => {
    if (langParam === 'tr') return 'tr';
    if (!restaurant) return 'tr';
    const enabled = restaurant.enabled_languages ?? [];
    return enabled.includes(langParam) ? langParam : 'tr';
  }, [langParam, restaurant]);

  const availableLanguages: LangCode[] = useMemo(() => {
    if (!restaurant) return ['tr'];
    const enabled = (restaurant.enabled_languages ?? []) as LangCode[];
    return ['tr', ...enabled.filter((l) => l !== 'tr')];
  }, [restaurant]);

  const setLang = (newLang: LangCode) => {
    const params = new URLSearchParams(searchParams);
    if (newLang === 'tr') { params.delete('lang'); } else { params.set('lang', newLang); }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!slug) return;
    const startTime = performance.now();
    const LOADING_MIN_MS = 500;

    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch restaurant first (secondary queries depend on its id)
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      const restaurantElapsed = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(`[Tabbled] Restaurant loaded in ${restaurantElapsed.toFixed(0)}ms`);
      }

      if (!rest) {
        const remaining = Math.max(0, LOADING_MIN_MS - restaurantElapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
        setLoading(false);
        return;
      }

      setRestaurant(rest);

      // 2. Fire categories/items/promos in PARALLEL. Do NOT await these —
      // they populate state as they arrive. The loading screen ends as soon as
      // we have the restaurant (plus the minimum display time), so the splash
      // can appear immediately; the menu data keeps loading in the background
      // and is typically ready by the time the user taps "View Menu".
      void Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('restaurant_id', rest.id)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', rest.id)
          .eq('is_available', true)
          .order('sort_order'),
        // NOTE: sold_out items are still fetched (shown with strikethrough / disabled order UI)
        supabase
          .from('restaurant_promos')
          .select('*')
          .eq('restaurant_id', rest.id)
          .eq('is_active', true)
          .order('sort_order'),
      ]).then(([{ data: cats }, { data: menuItems }, { data: promoData }]) => {
        setCategories(cats ?? []);
        setItems(menuItems ?? []);
        setPromos((promoData ?? []) as Promo[]);
        if (import.meta.env.DEV) {
          console.log(
            `[Tabbled] Menu data loaded in ${(performance.now() - startTime).toFixed(0)}ms`,
          );
        }
      });

      // 3. Release loading once the minimum display time has elapsed.
      const remaining = Math.max(0, LOADING_MIN_MS - restaurantElapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  /* ---- Scroll-aware category tracking ---- */
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingToCategory.current) return;
      // Only track when viewing "All" (no specific category selected)
      if (activeCategory) return;

      const sections = document.querySelectorAll('[data-category-id]');
      if (sections.length === 0) return;

      const tabBarHeight = 120;
      let currentCategory: string | null = null;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= tabBarHeight + 20 && rect.bottom > tabBarHeight) {
          currentCategory = section.getAttribute('data-category-id');
        }
      });

      if (currentCategory) {
        setScrollActiveCategory((prev) => {
          if (prev === currentCategory) return prev;
          // Scroll the active tab into view
          requestAnimationFrame(() => {
            const tabEl = tabBarRef.current?.querySelector(`[data-tab-id="${currentCategory}"]`);
            if (tabEl) tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          });
          return currentCategory;
        });
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [activeCategory]);

  const handleTabClick = useCallback((categoryId: string | null) => {
    if (categoryId === null) {
      setActiveCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If "All" view, scroll to section instead of filtering
    if (!activeCategory) {
      const section = document.querySelector(`[data-category-id="${categoryId}"]`);
      if (section) {
        isScrollingToCategory.current = true;
        setScrollActiveCategory(categoryId);
        const tabBarHeight = 120;
        const top = section.getBoundingClientRect().top + window.scrollY - tabBarHeight;
        window.scrollTo({ top, behavior: 'smooth' });
        const tabEl = tabBarRef.current?.querySelector(`[data-tab-id="${categoryId}"]`);
        if (tabEl) tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        setTimeout(() => { isScrollingToCategory.current = false; }, 800);
        return;
      }
    }

    setActiveCategory(categoryId);
  }, [activeCategory]);

  const headingFont = "'Playfair Display', serif";
  const bodyFont = "'Inter', sans-serif";

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#fff', fontFamily: bodyFont }}
      >
        <AnimatedLogo size={80} message={UI.loading[toUiLang(lang)]} />
      </div>
    );
  }

  /* ---- Not found ---- */
  if (!restaurant) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: bodyFont }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: theme.cardBg }}
        >
          <ForkKnife size={32} style={{ color: theme.mutedText }} />
        </div>
        <p className="text-lg" style={{ fontFamily: headingFont, fontWeight: 700 }}>{UI.notFound[toUiLang(lang)]}</p>
        <a href="https://tabbled.com" aria-label="Tabbled" className="hover:opacity-80 transition-opacity">
          <img src="/tabbled-logo-icon.png" alt="Tabbled" className="h-8 w-auto block" />
        </a>
      </div>
    );
  }

  const coverImageRaw = restaurant.cover_image_url || restaurant.cover_url;
  const coverImage = getOptimizedImageUrl(coverImageRaw, 'cover');
  const socials = [
    { type: 'instagram', url: restaurant.social_instagram },
    { type: 'facebook', url: restaurant.social_facebook },
    { type: 'x', url: restaurant.social_x },
    { type: 'tiktok', url: restaurant.social_tiktok },
    { type: 'website', url: restaurant.social_website },
    { type: 'whatsapp', url: restaurant.social_whatsapp },
    { type: 'google_maps', url: restaurant.social_google_maps },
  ].filter(s => s.url);

  /* ================================================================ */
  /*  SPLASH SCREEN                                                    */
  /* ================================================================ */

  if (showSplash) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: bodyFont }}
      >
        {/* Background */}
        {coverImage ? (
          <>
            <img onError={handleImageError} src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: theme.bg }} />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-[400px]">
          {/* Logo */}
          {restaurant.logo_url ? (
            <img
              src={getOptimizedImageUrl(restaurant.logo_url, 'card')}
              alt={restaurant.name}
              className="w-28 h-28 rounded-2xl object-cover shadow-2xl mb-6"
              style={{ border: `2px solid ${theme.cardBorder}` }}
            />
          ) : (
            <div
              className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl mb-6"
              style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.cardBorder}` }}
            >
              <span
                className="text-4xl"
                style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}
              >{restaurant.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {/* Name */}
          <h1
            className="text-3xl mb-2 drop-shadow-lg"
            style={{ fontFamily: headingFont, fontWeight: 700, color: '#FFFFFF' }}
          >{restaurant.name}</h1>

          {/* Tagline */}
          {restaurant.tagline && (
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 300 }}
            >
              {t(restaurant.translations, 'tagline', restaurant.tagline, lang)}
            </p>
          )}

          {/* Table badge */}
          {table && (
            <div
              className="text-sm px-5 py-2 rounded-xl mb-6 shadow-lg"
              style={{ backgroundColor: theme.accent, color: theme.key === 'white' ? '#FFFFFF' : theme.bg, fontWeight: 600 }}
            >
              {UI.table[toUiLang(lang)]} {table}
            </div>
          )}

          {/* Social Media Icons */}
          {socials.length > 0 && (
            <div className="flex items-center gap-4 mb-8">
              {socials.map(({ type, url }) => (
                <a
                  key={type}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
                >
                  <SocialIcon type={type} size={18} />
                </a>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={() => {
              setShowSplash(false);
              const next = promos.find(isPromoVisible);
              if (next) setTimeout(() => setActivePromo(next), 500);
            }}
            className="text-base px-10 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: theme.accent,
              color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
              fontFamily: bodyFont,
              fontWeight: 500,
            }}
          >
            {UI.viewMenu[toUiLang(lang)]}
          </button>

          {/* Language switcher */}
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2 mt-6">
              <Globe size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
              <div className="flex gap-1">
                {availableLanguages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-2.5 py-1 rounded-md text-xs transition-all"
                    style={{
                      backgroundColor: lang === l ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      color: lang === l ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      fontWeight: 500,
                    }}
                  >
                    {getLanguage(l)?.nativeName || l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Powered by */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Powered by</span>
          <a href="https://tabbled.com" aria-label="Tabbled" className="hover:opacity-80 transition-opacity">
            <img src="/tabbled-logo-horizontal.png" alt="Tabbled" className="h-5 w-auto block" />
          </a>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  MENU VIEW                                                        */
  /* ================================================================ */

  // Apply filters (allergen exclude AND, preferences OR) then category
  const activeFilterCount = excludeAllergens.length + preferences.length;
  const filterApplied = activeFilterCount > 0;

  // Filter out items whose schedule says "not now". Sold-out items stay visible.
  const scheduleFilteredItems = items.filter((it) => isItemVisibleBySchedule(it));

  const globallyFilteredItems = (() => {
    let list = scheduleFilteredItems;
    if (excludeAllergens.length > 0) {
      list = list.filter((item) => {
        const itemAllergens = item.allergens || [];
        return !excludeAllergens.some((a) => itemAllergens.includes(a));
      });
    }
    if (preferences.length > 0) {
      list = list.filter((item) => {
        const itemAllergens = item.allergens || [];
        return preferences.some((pref) => {
          if (pref === 'popular') return item.is_popular;
          if (pref === 'new') return item.is_new;
          if (pref === 'vegetarian') return itemAllergens.includes('vegetarian') || item.is_vegetarian;
          if (pref === 'vegan') return itemAllergens.includes('vegan');
          if (pref === 'halal') return itemAllergens.includes('halal');
          if (pref === 'kosher') return itemAllergens.includes('kosher');
          return false;
        });
      });
    }
    return list;
  })();

  // Build parent → children map and resolve item → top-level parent
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const topLevelParentId = (catId: string): string => {
    const cat = categoryMap.get(catId);
    if (!cat) return catId;
    return cat.parent_id ? topLevelParentId(cat.parent_id) : cat.id;
  };
  const childrenOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  // Per top-level parent, count items (descendants included).
  const categoryCountMap = new Map<string, number>();
  for (const it of globallyFilteredItems) {
    const top = topLevelParentId(it.category_id);
    categoryCountMap.set(top, (categoryCountMap.get(top) ?? 0) + 1);
  }
  // Tab bar only shows parents (top-level) that have at least one visible item.
  const visibleCategories = categories.filter(
    (c) => !c.parent_id && (categoryCountMap.get(c.id) ?? 0) > 0,
  );

  // If the active category got filtered out, fall back to "All". Active category
  // must be a parent that's visible.
  const effectiveActiveCategory =
    activeCategory && (categoryCountMap.get(activeCategory) ?? 0) > 0 ? activeCategory : null;

  // When a parent is active, include its direct child items too.
  const activeScopeIds: Set<string> | null = effectiveActiveCategory
    ? new Set([effectiveActiveCategory, ...childrenOf(effectiveActiveCategory).map((c) => c.id)])
    : null;

  const filteredItems = activeScopeIds
    ? globallyFilteredItems.filter((i) => activeScopeIds.has(i.category_id))
    : globallyFilteredItems;

  // Group items for display. Outer group = top-level parent; if children exist,
  // inner sub-groups by child category, otherwise flat list under the parent.
  type SubGroup = { category: MenuCategory | null; items: MenuItem[] };
  type Group = { category: MenuCategory | null; items: MenuItem[]; subgroups: SubGroup[] };
  const groupedItems: Group[] = [];

  if (!effectiveActiveCategory) {
    const catOrder = new Map(categories.map((c, i) => [c.id, i]));
    const byParent = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      const parentKey = topLevelParentId(item.category_id);
      if (!byParent.has(parentKey)) byParent.set(parentKey, []);
      byParent.get(parentKey)!.push(item);
    }
    const sortedParents = [...byParent.keys()].sort(
      (a, b) => (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999),
    );
    for (const parentId of sortedParents) {
      const parentCat = categoryMap.get(parentId) ?? null;
      const parentItems = byParent.get(parentId)!;
      const children = childrenOf(parentId);
      if (children.length === 0) {
        groupedItems.push({ category: parentCat, items: parentItems, subgroups: [] });
      } else {
        const directItems = parentItems.filter((i) => i.category_id === parentId);
        const sub: SubGroup[] = [];
        for (const child of children.sort((a, b) => a.sort_order - b.sort_order)) {
          const childItems = parentItems.filter((i) => i.category_id === child.id);
          if (childItems.length > 0) sub.push({ category: child, items: childItems });
        }
        groupedItems.push({ category: parentCat, items: directItems, subgroups: sub });
      }
    }
  }

  const hasNoItems = filteredItems.length === 0 && !effectiveActiveCategory && items.length === 0;
  const hasNoFilterResults = filterApplied && globallyFilteredItems.length === 0;
  const fl = FILTER_LABELS[toUiLang(lang)];

  const canonicalUrl = `https://tabbled.com/menu/${restaurant.slug}`;
  const ogImage =
    getOptimizedImageUrl(coverImageRaw, 'cover') ||
    getOptimizedImageUrl(restaurant.logo_url, 'cover') ||
    'https://tabbled.com/tabbled-logo-horizontal.png';
  const metaDescription = `${restaurant.name} dijital menüsü. ${restaurant.tagline || ''} ${restaurant.address || ''}`.trim();

  const handleAddToCart = (menuItem: MenuItem, variant?: string, price?: number) => {
    const itemName = t(menuItem.translations, 'name', menuItem.name_tr, lang);
    cart.addItem({
      id: menuItem.id,
      name: itemName,
      price: price ?? Number(menuItem.price),
      variant,
      image_url: menuItem.image_url ?? undefined,
    });
  };

  const cartEnabled = restaurant.feature_cart !== false;

  const handleCardAdd = cartEnabled ? (menuItem: MenuItem) => {
    if (hasVariants(menuItem)) {
      setSelectedItem(menuItem);
      return;
    }
    handleAddToCart(menuItem);
  } : undefined;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: bodyFont }}
    >
      <Helmet>
        <title>{`${restaurant.name} — Menü | Tabbled`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="restaurant.menu" />
        <meta property="og:title" content={`${restaurant.name} — Menü`} />
        <meta property="og:description" content={restaurant.tagline || `${restaurant.name} dijital menüsü`} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Tabbled" />
        <meta property="og:locale" content="tr_TR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${restaurant.name} — Menü`} />
        <meta name="twitter:description" content={restaurant.tagline || `${restaurant.name} dijital menüsü`} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            name: restaurant.name,
            description: restaurant.tagline || '',
            address: restaurant.address || '',
            telephone: restaurant.phone || '',
            url: canonicalUrl,
            image: ogImage,
            hasMenu: { '@type': 'Menu', url: canonicalUrl },
          })}
        </script>
      </Helmet>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-44" style={{ backgroundColor: theme.cardBg }}>
          <img onError={handleImageError} src={coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${theme.bg}, transparent)` }}
          />
        </div>
      )}

      {/* Header */}
      <header
        className={`px-4 ${coverImage ? '-mt-20 relative z-10 pt-4 pb-5' : 'py-6'}`}
        style={{ color: theme.text }}
      >
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-start gap-4">
            {restaurant.logo_url ? (
              <img
                src={getOptimizedImageUrl(restaurant.logo_url, 'thumbnail')}
                alt={restaurant.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-lg"
                style={{ border: `2px solid ${theme.cardBorder}` }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.cardBorder}` }}
              >
                <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 24, color: theme.text }}>
                  {restaurant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="text-xl leading-tight" style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}>
                {restaurant.name}
              </h1>
              {restaurant.tagline && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.mutedText, fontWeight: 300 }}>
                  {t(restaurant.translations, 'tagline', restaurant.tagline, lang)}
                </p>
              )}
              <div className="flex flex-col gap-2 mt-2 text-sm" style={{ color: theme.mutedText }}>
                {restaurant.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: theme.mutedText }} />
                    <span className="text-xs">{restaurant.address}</span>
                  </div>
                )}
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-2 hover:text-[#FF4F7A] transition-colors"
                    style={{ color: theme.mutedText }}
                  >
                    <Phone size={16} className="flex-shrink-0" />
                    <span className="text-xs">{restaurant.phone}</span>
                  </a>
                )}
                {restaurant.working_hours && (() => {
                  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const today = dayKeys[new Date().getDay()];
                  const todayHours = restaurant.working_hours[today];
                  if (!todayHours) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="flex-shrink-0" style={{ color: theme.mutedText }} />
                      <span className="text-xs flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${todayHours.closed ? 'bg-red-500' : 'bg-green-500'}`} />
                        {todayHours.closed ? (lang === 'tr' ? 'Bugün kapalı' : 'Closed today') : `${todayHours.open} - ${todayHours.close}`}
                      </span>
                    </div>
                  );
                })()}
              </div>
              {socials.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {socials.map(({ type, url }) => (
                    <a
                      key={type}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: theme.mutedText }}
                    >
                      <SocialIcon type={type} size={14} />
                    </a>
                  ))}
                </div>
              )}
              {/* Like button */}
              <button
                type="button"
                onClick={handleLike}
                disabled={liked}
                className="flex items-center gap-1.5 mt-2 transition-colors"
                style={{
                  background: 'none', border: 'none', cursor: liked ? 'default' : 'pointer',
                  color: liked ? '#FF4F7A' : theme.mutedText, fontSize: 12, fontWeight: 500, padding: 0,
                }}
              >
                <Heart size={18} weight={liked ? 'fill' : 'regular'} />
                {liked ? UI.liked[toUiLang(lang)] : UI.like[toUiLang(lang)]}
              </button>
            </div>
            {table && (
              <span
                className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
                  fontWeight: 600,
                }}
              >
                {UI.table[toUiLang(lang)]} {table}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            {availableLanguages.length > 1 ? (
              <div className="flex items-center gap-2">
                <Globe size={14} style={{ color: theme.mutedText }} />
                <div className="flex gap-1">
                  {availableLanguages.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className="px-2.5 py-1 rounded-md text-xs transition-all"
                      style={{
                        backgroundColor: lang === l ? theme.accent : theme.categoryBg,
                        color: lang === l ? theme.categoryActiveText : theme.mutedText,
                        fontWeight: 500,
                      }}
                    >
                      {getLanguage(l)?.nativeName || l}
                    </button>
                  ))}
                </div>
              </div>
            ) : <div />}

            <button
              onClick={() => setIsFilterOpen(true)}
              aria-label={fl.filters}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                backgroundColor: activeFilterCount > 0 ? theme.categoryActiveBg : theme.categoryBg,
                color: activeFilterCount > 0 ? theme.categoryActiveText : theme.mutedText,
                fontWeight: 500,
                minHeight: 32,
              }}
            >
              <Funnel size={16} />
              <span>{fl.filters}</span>
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full text-[10px] tabular-nums"
                  style={{
                    minWidth: 16, height: 16, padding: '0 4px',
                    backgroundColor: theme.accent,
                    color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Category Tab Bar */}
      <div
        className="sticky top-0 z-20"
        style={{ backgroundColor: `${theme.bg}ee`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderBottom: `1px solid ${theme.divider}` }}
      >
        <div className="max-w-[480px] mx-auto flex items-center" style={{ minHeight: 48 }}>
          <div
            ref={tabBarRef}
            className="flex gap-2 px-4 overflow-x-auto flex-1 min-w-0"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingTop: 8, paddingBottom: 8 }}
          >
            <button
              onClick={() => handleTabClick(null)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-all"
              style={{
                backgroundColor: effectiveActiveCategory === null && !scrollActiveCategory ? theme.categoryActiveBg : theme.categoryBg,
                color: effectiveActiveCategory === null && !scrollActiveCategory ? theme.categoryActiveText : theme.mutedText,
                fontWeight: 500,
                scrollSnapAlign: 'start',
              }}
            >
              {UI.all[toUiLang(lang)]}
            </button>
            {visibleCategories.map((cat) => {
              const isActive = effectiveActiveCategory === cat.id ||
                (!effectiveActiveCategory && scrollActiveCategory === cat.id);
              return (
                <button
                  key={cat.id}
                  data-tab-id={cat.id}
                  onClick={() => handleTabClick(cat.id)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 pr-4 rounded-full text-sm transition-all"
                  style={{
                    backgroundColor: isActive ? theme.categoryActiveBg : theme.categoryBg,
                    color: isActive ? theme.categoryActiveText : theme.mutedText,
                    fontWeight: 500,
                    scrollSnapAlign: 'start',
                    paddingLeft: cat.image_url ? 4 : 16,
                    paddingTop: 6,
                    paddingBottom: 6,
                  }}
                >
                  {cat.image_url && (
                    <img
                      src={getOptimizedImageUrl(cat.image_url, 'thumbnail')}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <span>{t(cat.translations, 'name', cat.name_tr, lang)}</span>
                  {filterApplied && (
                    <span className="opacity-70 tabular-nums">
                      ({categoryCountMap.get(cat.id) ?? 0})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Grid/List Toggle — same row, right side */}
          <div
            className="flex-shrink-0 flex items-center gap-1"
            style={{ paddingRight: 16, paddingLeft: 8, borderLeft: `1px solid ${theme.divider}` }}
          >
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center justify-center"
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                backgroundColor: viewMode === 'list' ? theme.categoryActiveBg : 'transparent',
                color: viewMode === 'list' ? theme.categoryActiveText : theme.mutedText,
                cursor: 'pointer',
              }}
              aria-label="Liste görünüm"
            >
              <ListBullets size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center justify-center"
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                backgroundColor: viewMode === 'grid' ? theme.categoryActiveBg : 'transparent',
                color: viewMode === 'grid' ? theme.categoryActiveText : theme.mutedText,
                cursor: 'pointer',
              }}
              aria-label="Grid görünüm"
            >
              <SquaresFour size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[480px] mx-auto pb-20" style={{ padding: '16px 16px 80px' }}>
        {filterApplied && !hasNoItems && (
          <p
            className="text-[11px] mb-3 text-center"
            style={{ color: theme.mutedText, fontWeight: 400 }}
          >
            {globallyFilteredItems.length} {fl.showing}
          </p>
        )}
        {hasNoFilterResults ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: theme.cardBg }}
            >
              <Funnel size={28} style={{ color: theme.mutedText }} />
            </div>
            <p className="text-sm mb-3" style={{ color: theme.mutedText }}>{fl.noResults}</p>
            <button
              onClick={() => { setExcludeAllergens([]); setPreferences([]); }}
              className="text-xs px-4 py-2 rounded-full"
              style={{
                backgroundColor: theme.accent,
                color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
                fontWeight: 500,
              }}
            >
              {fl.clearAll}
            </button>
          </div>
        ) : hasNoItems ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: theme.cardBg }}
            >
              <ForkKnife size={28} style={{ color: theme.mutedText }} />
            </div>
            <p className="text-sm" style={{ color: theme.mutedText }}>{UI.noItems[toUiLang(lang)]}</p>
          </div>
        ) : effectiveActiveCategory ? (
          (() => {
            const activeChildren = childrenOf(effectiveActiveCategory);
            if (activeChildren.length === 0) {
              return (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8 }}>
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} />
                  ))}
                  {filteredItems.length === 0 && (
                    <p className="text-center text-sm py-8 col-span-2" style={{ color: theme.mutedText }}>{UI.noItemsInCat[toUiLang(lang)]}</p>
                  )}
                </div>
              );
            }
            // Parent with children → show sub-category headers
            const directItems = filteredItems.filter((i) => i.category_id === effectiveActiveCategory);
            return (
              <div>
                {directItems.length > 0 && (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8, marginBottom: 32 }}>
                    {directItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} />
                    ))}
                  </div>
                )}
                {activeChildren
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((child) => {
                    const childItems = filteredItems.filter((i) => i.category_id === child.id);
                    if (childItems.length === 0) return null;
                    return (
                      <div key={child.id} style={{ marginBottom: 32 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div className="flex items-baseline gap-2">
                            <h3 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: theme.text }}>
                              {t(child.translations, 'name', child.name_tr, lang)}
                            </h3>
                            <span className="text-[12px]" style={{ color: theme.mutedText, fontWeight: 400 }}>
                              ({childItems.length})
                            </span>
                          </div>
                          <div style={{ height: 1, backgroundColor: theme.divider, opacity: 0.15, marginTop: 8 }} />
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8 }}>
                          {childItems.map((item) => (
                            <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })()
        ) : (
          groupedItems.map(({ category, items: catItems, subgroups }) => {
            const totalCount = catItems.length + subgroups.reduce((a, s) => a + s.items.length, 0);
            return (
            <div
              key={category?.id ?? 'other'}
              id={category ? `category-${category.id}` : undefined}
              data-category-id={category?.id}
              className="scroll-mt-20"
              style={{ marginBottom: 32 }}
            >
              <div style={{ marginBottom: 12, paddingTop: 0 }}>
                <div className="flex items-baseline gap-2">
                  <h2
                    style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: theme.text }}
                  >
                    {category ? t(category.translations, 'name', category.name_tr, lang) : UI.other[toUiLang(lang)]}
                  </h2>
                  <span className="text-[12px]" style={{ color: theme.mutedText, fontWeight: 400 }}>
                    ({totalCount} {toUiLang(lang) === 'tr' ? 'ürün' : toUiLang(lang) === 'ar' ? 'عنصر' : toUiLang(lang) === 'zh' ? '项' : 'items'})
                  </span>
                </div>
                <div style={{ height: 1, backgroundColor: theme.divider, opacity: 0.15, marginTop: 8 }} />
              </div>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8 }}>
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} />
                ))}
              </div>
              {subgroups.map((sg) => (
                <div key={sg.category?.id ?? 'sub-other'} style={{ marginTop: 20 }}>
                  <div className="flex items-baseline gap-2" style={{ marginBottom: 12 }}>
                    <h3 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: theme.text }}>
                      {sg.category ? t(sg.category.translations, 'name', sg.category.name_tr, lang) : ''}
                    </h3>
                    <span className="text-[12px]" style={{ color: theme.mutedText, fontWeight: 400 }}>
                      ({sg.items.length})
                    </span>
                  </div>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8 }}>
                    {sg.items.map((item) => (
                      <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            );
          })
        )}
      </main>

      {/* Bottom bars container */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Cart bottom bar — only if cart feature enabled */}
        {restaurant.feature_cart !== false && (
          <CartBottomBar
            totalItems={cart.totalItems}
            totalAmount={cart.totalAmount}
            onOpen={() => setCartDrawerOpen(true)}
            theme={theme}
            label={UI.viewCart[toUiLang(lang)]}
            itemsLabel={UI.cartItems[toUiLang(lang)]}
          />
        )}
        {/* Waiter call bar — only if feature enabled */}
        {table && restaurant.feature_waiter_calls !== false && (
          <WaiterCallBar restaurantId={restaurant.id} tableNumber={table} theme={theme} language={lang} />
        )}
        {/* Powered by (no table, no cart) */}
        {!table && cart.totalItems === 0 && (
          <div
            className="backdrop-blur-sm py-3"
            style={{ backgroundColor: theme.bg, borderTop: `1px solid ${theme.divider}` }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px]" style={{ color: theme.mutedText }}>Powered by</span>
              <a href="https://tabbled.com" aria-label="Tabbled" className="hover:opacity-80 transition-opacity inline-flex">
                <img src="/tabbled-logo-horizontal.png" alt="Tabbled" className="h-4 w-auto block" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <CartDrawer
          items={cart.items}
          note={cart.note}
          totalAmount={cart.totalAmount}
          totalItems={cart.totalItems}
          subtotal={cart.subtotal}
          discountAmount={cart.discountAmount}
          appliedDiscount={cart.appliedDiscount}
          onUpdateQuantity={cart.updateQuantity}
          onDeleteItem={cart.deleteItem}
          onSetNote={cart.setNote}
          onClearCart={cart.clearCart}
          onApplyDiscount={cart.applyDiscount}
          onRemoveDiscount={cart.removeDiscount}
          onClose={() => setCartDrawerOpen(false)}
          theme={theme}
          lang={lang}
          ui={{
            yourCart: UI.yourCart[toUiLang(lang)],
            emptyCart: UI.emptyCart[toUiLang(lang)],
            emptyCartConfirm: UI.emptyCartConfirm[toUiLang(lang)],
            cartEmpty: UI.cartEmpty[toUiLang(lang)],
            addNote: UI.addNote[toUiLang(lang)],
            notePlaceholder: UI.notePlaceholder[toUiLang(lang)],
            total: UI.cartTotal[toUiLang(lang)],
            items: UI.cartItems[toUiLang(lang)],
            sendViaWhatsApp: UI.sendWhatsApp[toUiLang(lang)],
            whatsappNotAvailable: UI.whatsappNA[toUiLang(lang)],
          }}
          discountUi={{
            enterDiscountCode: UI.enterDiscountCode[toUiLang(lang)],
            apply: UI.applyCode[toUiLang(lang)],
            invalidCode: UI.invalidCode[toUiLang(lang)],
            codeExpired: UI.codeExpired[toUiLang(lang)],
            codeInactive: UI.codeInactive[toUiLang(lang)],
            codeNotYetActive: UI.codeNotYetActive[toUiLang(lang)],
            codeLimitReached: UI.codeLimitReached[toUiLang(lang)],
            minOrderRequired: UI.minOrderRequired[toUiLang(lang)],
            percentOff: UI.percentOff[toUiLang(lang)],
            discountApplied: UI.discountApplied[toUiLang(lang)],
          }}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          whatsappNumber={restaurant.feature_whatsapp_order !== false ? restaurant.social_whatsapp : null}
          tableNumber={table}
          discountEnabled={restaurant.feature_discount_codes !== false}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal item={selectedItem} lang={lang} theme={theme} onClose={() => setSelectedItem(null)} onAddToCart={cartEnabled ? handleAddToCart : undefined} />
      )}

      {/* Promo Popup */}
      {activePromo && (
        <PromoPopup
          promo={activePromo}
          theme={theme}
          lang={toUiLang(lang)}
          onClose={() => setActivePromo(null)}
          onNavigateCategory={(categoryId) => {
            setActiveCategory(null);
            setTimeout(() => {
              const el = document.getElementById(`category-${categoryId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
        />
      )}

      {/* Filter Panel */}
      {isFilterOpen && (
        <FilterPanel
          lang={lang}
          theme={theme}
          excludeAllergens={excludeAllergens}
          preferences={preferences}
          onToggleAllergen={(key) =>
            setExcludeAllergens((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
            )
          }
          onTogglePreference={(key) =>
            setPreferences((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
            )
          }
          onClearAll={() => { setExcludeAllergens([]); setPreferences([]); }}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {/* Google Review Prompt */}
      {showReviewPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowReviewPrompt(false)}
        >
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <Heart size={32} weight="fill" className="text-[#FF4F7A] mx-auto mb-2" />
              <h3 className="text-lg font-semibold">{UI.reviewPromptTitle[toUiLang(lang)]}</h3>
              <p className="text-sm text-gray-500 mt-1">{UI.reviewPromptText[toUiLang(lang)]}</p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={`https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#FF4F7A] text-white rounded-xl text-center font-medium hover:bg-[#e8456e] transition-colors"
                onClick={() => setShowReviewPrompt(false)}
              >
                {UI.reviewButton[toUiLang(lang)]}
              </a>
              <button
                onClick={() => setShowReviewPrompt(false)}
                className="w-full py-3 text-gray-500 text-sm"
              >
                {UI.notNow[toUiLang(lang)]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Panel                                                       */
/* ------------------------------------------------------------------ */

function FilterPanel({
  lang, theme, excludeAllergens, preferences,
  onToggleAllergen, onTogglePreference, onClearAll, onClose,
}: {
  lang: LangCode;
  theme: MenuTheme;
  excludeAllergens: string[];
  preferences: string[];
  onToggleAllergen: (key: string) => void;
  onTogglePreference: (key: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const fl = FILTER_LABELS[toUiLang(lang)];
  const headingFont = "'Playfair Display', serif";
  const bodyFont = "'Inter', sans-serif";
  const iconLang: 'tr' | 'en' = lang === 'tr' ? 'tr' : 'en';

  const prefChips: { key: string; label: string }[] = [
    { key: 'popular', label: fl.popular },
    { key: 'new', label: fl.new },
    { key: 'vegetarian', label: fl.vegetarian },
    { key: 'vegan', label: fl.vegan },
    { key: 'halal', label: fl.halal },
    { key: 'kosher', label: fl.kosher },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'modalBackdropIn 0.2s ease-out' }} />

      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: theme.modalBg, color: theme.text, fontFamily: bodyFont, animation: 'modalSlideUp 0.3s ease-out forwards' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 backdrop-blur-sm"
          style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.divider}` }}
        >
          <h2 className="text-lg" style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}>
            {fl.filters}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ color: theme.mutedText, fontWeight: 500 }}
            >
              {fl.clearAll}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.badgeBg, color: theme.text }}
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Free From (14 EU Allergens) */}
          <div>
            <h3
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: theme.mutedText, fontWeight: 600 }}
            >
              {fl.freeFrom}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_LIST.map((allergen) => {
                const label = iconLang === 'tr' ? allergen.name_tr : allergen.name_en;
                const selected = excludeAllergens.includes(allergen.key);
                return (
                  <button
                    key={allergen.key}
                    onClick={() => onToggleAllergen(allergen.key)}
                    className="inline-flex items-center px-3 rounded-full text-xs transition-all"
                    style={{
                      minHeight: 36,
                      backgroundColor: selected ? '#fdf2f8' : theme.categoryBg,
                      color: selected ? '#FF4F7A' : theme.text,
                      border: `1px solid ${selected ? '#FF4F7A' : theme.cardBorder}`,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences (Diet + Popular/New) */}
          <div>
            <h3
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: theme.mutedText, fontWeight: 600 }}
            >
              {fl.preferences}
            </h3>
            <div className="flex flex-wrap gap-2">
              {prefChips.map(({ key, label }) => {
                const selected = preferences.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => onTogglePreference(key)}
                    className="inline-flex items-center px-4 rounded-full text-xs transition-all"
                    style={{
                      minHeight: 36,
                      backgroundColor: selected ? '#fdf2f8' : theme.categoryBg,
                      color: selected ? '#FF4F7A' : theme.text,
                      border: `1px solid ${selected ? '#FF4F7A' : theme.cardBorder}`,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply */}
        <div
          className="sticky bottom-0 p-4 backdrop-blur-sm"
          style={{ backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.divider}` }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm shadow-lg transition-all"
            style={{
              backgroundColor: theme.accent,
              color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            {fl.apply}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Menu Item Card                                                     */
/* ------------------------------------------------------------------ */

const SOLD_OUT_LABELS: Record<UiLangCode, string> = {
  tr: 'Tükendi', en: 'Sold Out', ar: 'نفد', zh: '售罄',
};

function MenuItemCard({ item, lang, theme, onSelect, viewMode = 'list', onAddToCart, cartQty }: { item: MenuItem; lang: LangCode; theme: MenuTheme; onSelect: (item: MenuItem) => void; viewMode?: 'grid' | 'list'; onAddToCart?: (item: MenuItem) => void; cartQty?: number }) {
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasBadges = item.is_popular || item.is_new || item.is_vegetarian;
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const headingFont = "'Playfair Display', serif";
  const bodyFont = "'Inter', sans-serif";
  const isFeatured = item.is_featured;
  const isSoldOut = item.is_sold_out;
  const displayCalories = item.nutrition?.calories ?? item.calories ?? null;
  const prepTime = item.prep_time ?? null;
  const minutesLabel = UI.minutes[toUiLang(lang)];
  const soldOutLabel = SOLD_OUT_LABELS[toUiLang(lang)];
  const soldOutWrapperStyle: React.CSSProperties = isSoldOut ? { opacity: 0.6 } : {};
  const soldOutPriceStyle: React.CSSProperties = isSoldOut ? { textDecoration: 'line-through', opacity: 0.5 } : {};
  const happyHour = !isSoldOut && isHappyHourActive(item);
  const hhPrice = happyHour ? (item.happy_hour_price ?? null) : null;
  const hhDiscount = hhPrice != null ? Math.round((1 - hhPrice / Number(item.price)) * 100) : 0;
  const hhLabel = item.happy_hour_label || 'Happy Hour';
  const discountWord = HH_DISCOUNT_LABEL[toUiLang(lang)] || 'off';

  const HappyHourBadge = happyHour ? (
    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, color: '#fff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: 4, zIndex: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Tag size={10} /> {hhLabel}
    </span>
  ) : null;

  const renderHHPrice = (originalPrice: number, hhp: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 11, textDecoration: 'line-through', color: theme.mutedText }}>{originalPrice.toFixed(2)} ₺</span>
      <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, color: '#FF4F7A' }}>{hhp.toFixed(2)} ₺</span>
      <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>%{Math.round((1 - hhp / originalPrice) * 100)} {discountWord}</span>
    </div>
  );

  const SoldOutBadge = isSoldOut ? (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
      style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}
    >
      {soldOutLabel}
    </span>
  ) : null;

  const canAddToCart = !isSoldOut && onAddToCart;
  const isVariant = hasVariants(item);
  const cartAccent = theme.key === 'red' ? '#fff' : '#FF4F7A';

  const AddButton = canAddToCart ? (
    (cartQty ?? 0) > 0 && !isVariant ? (
      <QuantitySelector
        quantity={cartQty!}
        onIncrement={() => onAddToCart!(item)}
        onDecrement={() => {/* handled via cart.removeItem in parent */}}
        size="sm"
        theme={theme}
      />
    ) : (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); isVariant ? onSelect(item) : onAddToCart!(item); }}
        style={{
          width: 32, height: 32, borderRadius: 16,
          border: 'none', backgroundColor: cartAccent, color: '#fff',
          fontSize: 18, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s',
          flexShrink: 0,
        }}
      >
        +
      </button>
    )
  ) : null;

  if (isFeatured) {
    return (
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98]"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow, ...soldOutWrapperStyle }}
        onClick={() => onSelect(item)}
      >
        <div className="relative">
          {item.image_url ? (
            <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'detail')} alt={name} className="w-full h-48 object-cover" loading="lazy" decoding="async" />
          ) : (
            <div
              className="w-full flex items-center justify-center"
              style={{ height: 128, backgroundColor: `${theme.accent}15`, borderRadius: '8px 8px 0 0' }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: `${theme.accent}80`, fontFamily: headingFont }}>
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {HappyHourBadge}
          {isSoldOut && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: theme.key === 'black' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: '#dc2626', padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {soldOutLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{ padding: 12 }}>
          <div className="flex items-start justify-between gap-2" style={{ marginBottom: 4 }}>
            <h3 style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: theme.text }}>
              {name || <span className="italic" style={{ color: theme.mutedText }}>—</span>}
            </h3>
            {hhPrice != null ? renderHHPrice(Number(item.price), hhPrice) : (
              <span className="flex-shrink-0 tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, color: theme.price, ...soldOutPriceStyle }}>
                {formatPriceDisplay(item, toUiLang(lang))}
              </span>
            )}
          </div>
          {SoldOutBadge && <div style={{ marginBottom: 4 }}>{SoldOutBadge}</div>}
          {description && (
            <p className="line-clamp-2" style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 400, lineHeight: 1.5, color: theme.mutedText, marginTop: 4 }}>
              {stripHtml(description)}
            </p>
          )}
          {hasBadges && (
            <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 8 }}>
              {item.is_popular && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                  <Star size={10} /> {UI.popular[toUiLang(lang)]}
                </span>
              )}
              {item.is_new && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                  {UI.newItem[toUiLang(lang)]}
                </span>
              )}
              {item.is_vegetarian && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}>
                  <AppleLogo size={10} /> {UI.vegetarian[toUiLang(lang)]}
                </span>
              )}
            </div>
          )}
          {(displayCalories != null || prepTime != null || hasAllergens) && (
            <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.divider}` }}>
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: theme.mutedText, fontWeight: 300 }}>
                {displayCalories != null && <span>{displayCalories} kcal</span>}
                {displayCalories != null && prepTime != null && <span aria-hidden>·</span>}
                {prepTime != null && (
                  <span className="inline-flex items-center gap-0.5">
                    <Timer size={11} /> {prepTime} {minutesLabel}
                  </span>
                )}
              </span>
              {hasAllergens && (
                <AllergenBadgeList allergens={item.allergens} size={16} lang={toUiLang(lang) === 'ar' || toUiLang(lang) === 'zh' ? 'en' : (toUiLang(lang) as 'tr' | 'en')} invert={theme.invertIcons} />
              )}
            </div>
          )}
          {AddButton && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>{AddButton}</div>}
        </div>
      </div>
    );
  }

  /* ---- Grid card ---- */
  if (viewMode === 'grid') {
    return (
      <div
        className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98]"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow, ...soldOutWrapperStyle }}
        onClick={() => onSelect(item)}
      >
        <div className="relative">
          {item.image_url ? (
            <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt={name} className="w-full object-cover" style={{ height: 128 }} loading="lazy" decoding="async" />
          ) : (
            <div
              className="w-full flex items-center justify-center"
              style={{ aspectRatio: '4/3', borderRadius: '8px 8px 0 0', backgroundColor: `${theme.accent}15` }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: `${theme.accent}80`, fontFamily: headingFont }}>
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {HappyHourBadge}
          {isSoldOut && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: theme.key === 'black' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: '#dc2626', padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {soldOutLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{ padding: 12 }}>
          <h3 className="line-clamp-2" style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: theme.text, marginBottom: 4 }}>
            {name || <span className="italic" style={{ color: theme.mutedText }}>—</span>}
          </h3>
          {SoldOutBadge && <div style={{ marginBottom: 4 }}>{SoldOutBadge}</div>}
          {hhPrice != null ? renderHHPrice(Number(item.price), hhPrice) : (
            <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 15, color: theme.price, ...soldOutPriceStyle }}>
              {formatPriceDisplay(item, toUiLang(lang))}
            </span>
          )}
          {(displayCalories != null || prepTime != null) && (
            <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
              <span className="text-[10px]" style={{ color: theme.mutedText }}>
                {displayCalories != null && <span>{displayCalories} kcal</span>}
                {displayCalories != null && prepTime != null && <span> · </span>}
                {prepTime != null && <span>{prepTime} {minutesLabel}</span>}
              </span>
            </div>
          )}
          {AddButton && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>{AddButton}</div>}
        </div>
      </div>
    );
  }

  /* ---- List card (default) ---- */
  return (
    <div
      className="rounded-2xl flex transition-all duration-200 cursor-pointer active:scale-[0.98]"
      style={{
        padding: 12,
        gap: 12,
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
        ...soldOutWrapperStyle,
      }}
      onClick={() => onSelect(item)}
    >
      <div className="relative flex-shrink-0">
        {item.image_url ? (
          <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt={name} className="w-[88px] h-[88px] rounded-lg object-cover" loading="lazy" decoding="async" />
        ) : (
          <div
            className="w-[88px] h-[88px] rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${theme.accent}15` }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: `${theme.accent}80`, fontFamily: headingFont }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {happyHour && <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, fontWeight: 700, color: '#fff', backgroundColor: '#f59e0b', padding: '1px 5px', borderRadius: 3, zIndex: 2 }}>{hhLabel}</span>}
        {isSoldOut && (
          <div
            className="absolute inset-0 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: theme.key === 'black' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', backgroundColor: '#dc2626', padding: '3px 10px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {soldOutLabel}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2"
            style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, lineHeight: 1.3, color: theme.text }}
          >
            {name || <span className="italic" style={{ color: theme.mutedText }}>—</span>}
          </h3>
          {hhPrice != null ? renderHHPrice(Number(item.price), hhPrice) : (
            <span
              className="flex-shrink-0 tabular-nums"
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, color: theme.price, ...soldOutPriceStyle }}
            >
              {formatPriceDisplay(item, toUiLang(lang))}
            </span>
          )}
        </div>
        {SoldOutBadge && <div style={{ marginTop: 4 }}>{SoldOutBadge}</div>}
        {description && (
          <p className="line-clamp-2" style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 400, lineHeight: 1.5, color: theme.mutedText, marginTop: 4 }}>
            {stripHtml(description)}
          </p>
        )}
        {hasBadges && (
          <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 8 }}>
            {item.is_popular && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
              >
                <Star size={10} /> {UI.popular[toUiLang(lang)]}
              </span>
            )}
            {item.is_new && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
              >
                {UI.newItem[toUiLang(lang)]}
              </span>
            )}
            {item.is_vegetarian && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
              >
                <AppleLogo size={10} /> {UI.vegetarian[toUiLang(lang)]}
              </span>
            )}
          </div>
        )}
        {(displayCalories != null || prepTime != null || hasAllergens) && (
          <div className="flex items-center justify-between mt-auto" style={{ paddingTop: 4 }}>
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: theme.mutedText, fontWeight: 300 }}>
              {displayCalories != null && <span>{displayCalories} kcal</span>}
              {displayCalories != null && prepTime != null && <span aria-hidden>·</span>}
              {prepTime != null && (
                <span className="inline-flex items-center gap-0.5">
                  <Timer size={11} /> {prepTime} {minutesLabel}
                </span>
              )}
            </span>
            {hasAllergens && (
              <AllergenBadgeList
                allergens={item.allergens}
                size={16}
                lang={toUiLang(lang) === 'ar' || toUiLang(lang) === 'zh' ? 'en' : (toUiLang(lang) as 'tr' | 'en')}
                invert={theme.invertIcons}
              />
            )}
          </div>
        )}
        {AddButton && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 4 }}>{AddButton}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Item Detail Modal                                                  */
/* ------------------------------------------------------------------ */

function ItemDetailModal({ item, lang, theme, onClose, onAddToCart }: { item: MenuItem; lang: LangCode; theme: MenuTheme; onClose: () => void; onAddToCart?: (item: MenuItem, variant?: string, price?: number) => void }) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(hasVariants(item) ? null : 0);
  const [modalQty, setModalQty] = useState(1);
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const headingFont = "'Playfair Display', serif";
  const bodyFont = "'Inter', sans-serif";
  const happyHour = !item.is_sold_out && isHappyHourActive(item);
  const isVariant = hasVariants(item);
  const cartAccent = theme.key === 'red' ? '#fff' : '#FF4F7A';
  const hhPrice = happyHour ? (item.happy_hour_price ?? null) : null;
  const hhLabel = item.happy_hour_label || 'Happy Hour';
  const discountWord = HH_DISCOUNT_LABEL[toUiLang(lang)] || 'off';
  const DAY_LABELS: Record<string, string> = { mon: 'Pzt', tue: 'Sal', wed: 'Çar', thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <style>{`
        @keyframes modalSlideUp { from { transform: translateY(100%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }
        @keyframes modalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'modalBackdropIn 0.2s ease-out' }} />

      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: theme.modalBg, color: theme.text, fontFamily: bodyFont, animation: 'modalSlideUp 0.3s ease-out forwards' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#FFFFFF' }}
        >
          <XCircle size={20} />
        </button>

        {item.image_url ? (
          <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'detail')} alt={name} className="w-full h-64 object-cover rounded-t-3xl sm:rounded-t-3xl" loading="lazy" decoding="async" />
        ) : (
          <div
            className="w-full flex items-center justify-center rounded-t-3xl"
            style={{ height: 192, backgroundColor: `${theme.accent}15` }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: `${theme.accent}80`, fontFamily: headingFont }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="p-5">
          {(item.is_popular || item.is_new || item.is_vegetarian) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {item.is_popular && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
                >
                  <Star size={14} /> {UI.popular[toUiLang(lang)]}
                </span>
              )}
              {item.is_new && (
                <span
                  className="inline-flex items-center gap-0.5 text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
                >
                  {UI.newItem[toUiLang(lang)]}
                </span>
              )}
              {item.is_vegetarian && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText, fontWeight: 600 }}
                >
                  <AppleLogo size={14} /> {UI.vegetarian[toUiLang(lang)]}
                </span>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-3">
            <h2
              className="text-xl leading-tight"
              style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}
            >
              {name}
            </h2>
            {!hasVariants(item) && (
              hhPrice != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 13, textDecoration: 'line-through', color: theme.mutedText }}>{Number(item.price).toFixed(2)} ₺</span>
                  <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 20, color: '#FF4F7A' }}>{hhPrice.toFixed(2)} ₺</span>
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>%{Math.round((1 - hhPrice / Number(item.price)) * 100)} {discountWord}</span>
                </div>
              ) : (
                <span
                  className="text-xl flex-shrink-0 tabular-nums"
                  style={{
                    fontFamily: bodyFont,
                    color: theme.price,
                    fontWeight: 700,
                    textDecoration: item.is_sold_out ? 'line-through' : 'none',
                  }}
                >
                  {Number(item.price).toFixed(2)} ₺
                </span>
              )
            )}
          </div>

          {/* Happy Hour info box */}
          {happyHour && item.happy_hour_start_time && item.happy_hour_end_time && (
            <div style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={14} />
              <div>
                <div style={{ fontWeight: 600 }}>{hhLabel}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {item.happy_hour_start_time.slice(0, 5)} - {item.happy_hour_end_time.slice(0, 5)}
                  {item.happy_hour_days && item.happy_hour_days.length > 0 && (
                    <> · {item.happy_hour_days.map(d => DAY_LABELS[d] || d).join(', ')}</>
                  )}
                </div>
              </div>
            </div>
          )}

          {item.is_sold_out && (
            <div className="mb-3">
              <span
                className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 700 }}
              >
                {UI.soldOut[toUiLang(lang)]}
              </span>
            </div>
          )}

          {description && (
            <div
              className="rich-text text-sm leading-relaxed mb-4"
              style={{ color: theme.mutedText, fontWeight: 300 }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {/* Variants list */}
          {hasVariants(item) && (
            <div
              className="mb-4 rounded-2xl overflow-hidden"
              style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <div
                className="px-4 py-2 text-[11px] uppercase tracking-wider"
                style={{
                  color: theme.mutedText,
                  fontWeight: 600,
                  borderBottom: `1px solid ${theme.divider}`,
                }}
              >
                {UI.sizeOptions[toUiLang(lang)]}
              </div>
              {item.price_variants.map((v, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 flex items-start justify-between gap-3"
                  style={{
                    borderBottom: idx < item.price_variants.length - 1 ? `1px solid ${theme.divider}` : 'none',
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm"
                      style={{ color: theme.text, fontWeight: 600 }}
                    >
                      {variantDisplayName(v, lang)}
                    </div>
                    {v.calories != null && (
                      <div className="text-[11px] mt-0.5" style={{ color: theme.mutedText, fontWeight: 300 }}>
                        {v.calories} kcal
                      </div>
                    )}
                  </div>
                  {happyHour && (v as any).happy_hour_price ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 11, textDecoration: 'line-through', color: theme.mutedText }}>{Number(v.price).toFixed(2)} ₺</span>
                      <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 700, color: '#FF4F7A' }}>{Number((v as any).happy_hour_price).toFixed(2)} ₺</span>
                    </div>
                  ) : (
                    <span
                      className="text-sm flex-shrink-0 tabular-nums"
                      style={{
                        color: theme.price,
                        fontWeight: 600,
                        textDecoration: item.is_sold_out ? 'line-through' : 'none',
                      }}
                    >
                      {Number(v.price).toFixed(2)} ₺
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasVariants(item) && !(item.nutrition && item.nutrition.show_on_menu !== false) && (item.nutrition?.calories ?? item.calories) != null && (
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText }}>
              <Thermometer size={16} />
              <span>{item.nutrition?.calories ?? item.calories} kcal</span>
            </div>
          )}

          {item.prep_time != null && (
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText }}>
              <Timer size={16} />
              <span>
                {UI.prepTime[toUiLang(lang)]}: {item.prep_time} {UI.minutes[toUiLang(lang)]}
              </span>
            </div>
          )}

          {hasAllergens && (
            <div className="pt-4" style={{ borderTop: `1px solid ${theme.divider}` }}>
              <p
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: theme.mutedText, fontWeight: 600 }}
              >
                {UI.allergens[toUiLang(lang)]}
              </p>
              <AllergenBadgeList
                allergens={item.allergens}
                size={24}
                showLabel
                lang={toUiLang(lang) === 'ar' || toUiLang(lang) === 'zh' ? 'en' : (toUiLang(lang) as 'tr' | 'en')}
                invert={theme.invertIcons}
                labelColor={theme.text}
              />
            </div>
          )}

          {item.nutrition && item.nutrition.show_on_menu !== false && (
            <NutritionFactsTable nutrition={item.nutrition} lang={lang} theme={theme} />
          )}

          {/* Add to Cart */}
          {onAddToCart && !item.is_sold_out && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.divider}` }}>
              {isVariant && (
                <div style={{ marginBottom: 12 }}>
                  {item.price_variants.map((v, idx) => {
                    const sel = selectedVariant === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedVariant(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '10px 12px', marginBottom: 4,
                          borderRadius: 8, cursor: 'pointer',
                          border: `2px solid ${sel ? cartAccent : theme.cardBorder}`,
                          backgroundColor: sel ? `${cartAccent}10` : 'transparent',
                          color: theme.text, fontSize: 14, fontFamily: bodyFont,
                        }}
                      >
                        <span style={{ fontWeight: sel ? 600 : 400 }}>{variantDisplayName(v, lang)}</span>
                        <span style={{ fontWeight: 600, color: sel ? cartAccent : theme.price }}>{Number(v.price).toFixed(2)} ₺</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <QuantitySelector
                  quantity={modalQty}
                  onIncrement={() => setModalQty(q => q + 1)}
                  onDecrement={() => setModalQty(q => Math.max(1, q - 1))}
                  size="md"
                  theme={theme}
                />
                <button
                  type="button"
                  disabled={isVariant && selectedVariant === null}
                  onClick={() => {
                    if (isVariant && selectedVariant === null) return;
                    const v = isVariant ? item.price_variants[selectedVariant!] : null;
                    const price = v ? Number(v.price) : Number(item.price);
                    const variantName = v ? variantDisplayName(v, lang) : undefined;
                    for (let i = 0; i < modalQty; i++) {
                      onAddToCart(item, variantName, price);
                    }
                    onClose();
                  }}
                  style={{
                    flex: 1, height: 48, borderRadius: 12, border: 'none',
                    backgroundColor: (isVariant && selectedVariant === null) ? theme.mutedText : cartAccent,
                    color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    fontFamily: bodyFont,
                    opacity: (isVariant && selectedVariant === null) ? 0.5 : 1,
                  }}
                >
                  {UI.addToCart[toUiLang(lang)]} — {(
                    (isVariant && selectedVariant !== null
                      ? Number(item.price_variants[selectedVariant].price)
                      : Number(item.price)
                    ) * modalQty
                  ).toFixed(2)} ₺
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nutrition Facts Table (FDA-style)                                  */
/* ------------------------------------------------------------------ */

function NutritionFactsTable({
  nutrition,
  lang,
  theme,
}: {
  nutrition: Nutrition;
  lang: LangCode;
  theme: MenuTheme;
}) {
  const headingFont = "'Playfair Display', serif";
  const uiLang = toUiLang(lang);

  // Helper: render a row only if value is a number (0 is allowed)
  type RowProps = {
    label: string;
    value: number | undefined;
    unit: string;
    indent?: boolean;
    bold?: boolean;
  };
  const Row = ({ label, value, unit, indent, bold }: RowProps) => {
    if (typeof value !== 'number') return null;
    return (
      <div
        className="flex items-baseline justify-between py-1"
        style={{
          color: theme.text,
          fontWeight: bold ? 600 : 400,
          paddingLeft: indent ? 16 : 0,
        }}
      >
        <span className="text-sm">{label}</span>
        <span className="text-sm tabular-nums" style={{ color: theme.text }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
    );
  };

  const Divider = () => (
    <div className="my-2" style={{ height: 1, backgroundColor: theme.divider }} />
  );

  return (
    <div
      className="mt-5 pt-4"
      style={{ borderTop: `1px solid ${theme.divider}` }}
    >
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
        }}
      >
        <h3
          className="text-base"
          style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}
        >
          {UI.nutritionTitle[uiLang]}
        </h3>
        {nutrition.serving_size && (
          <p className="text-xs mt-1" style={{ color: theme.mutedText, fontWeight: 300 }}>
            {UI.servingSize[uiLang]}: {nutrition.serving_size}
          </p>
        )}
        <Divider />

        <Row label={UI.calories[uiLang]} value={nutrition.calories} unit="kcal" bold />
        <Row label={UI.caloriesFromFat[uiLang]} value={nutrition.calories_from_fat} unit="kcal" indent />

        <Divider />

        <Row label={UI.totalFat[uiLang]} value={nutrition.total_fat} unit="g" bold />
        <Row label={UI.saturatedFat[uiLang]} value={nutrition.saturated_fat} unit="g" indent />
        <Row label={UI.transFat[uiLang]} value={nutrition.trans_fat} unit="g" indent />
        <Row label={UI.cholesterol[uiLang]} value={nutrition.cholesterol} unit="mg" />
        <Row label={UI.sodium[uiLang]} value={nutrition.sodium} unit="mg" />

        <Divider />

        <Row label={UI.totalCarb[uiLang]} value={nutrition.total_carb} unit="g" bold />
        <Row label={UI.dietaryFiber[uiLang]} value={nutrition.dietary_fiber} unit="g" indent />
        <Row label={UI.sugars[uiLang]} value={nutrition.sugars} unit="g" indent />
        <Row label={UI.protein[uiLang]} value={nutrition.protein} unit="g" bold />

        {(typeof nutrition.vitamin_a === 'number' ||
          typeof nutrition.vitamin_c === 'number' ||
          typeof nutrition.calcium === 'number' ||
          typeof nutrition.iron === 'number') && (
          <>
            <Divider />
            <Row label={UI.vitaminA[uiLang]} value={nutrition.vitamin_a} unit="%" />
            <Row label={UI.vitaminC[uiLang]} value={nutrition.vitamin_c} unit="%" />
            <Row label={UI.calcium[uiLang]} value={nutrition.calcium} unit="%" />
            <Row label={UI.iron[uiLang]} value={nutrition.iron} unit="%" />
          </>
        )}

        <p className="text-[11px] mt-3" style={{ color: theme.mutedText, fontWeight: 300 }}>
          {UI.dailyValue[uiLang]}
        </p>
      </div>
    </div>
  );
}
