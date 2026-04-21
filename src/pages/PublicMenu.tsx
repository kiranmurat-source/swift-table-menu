import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabase';
import { getOptimizedImageUrl, handleImageError } from '../lib/imageUtils';
import {
  Star, AppleLogo, Thermometer, MapPin, Phone, Globe, CaretDown, CaretLeft,
  ForkKnife, XCircle, Funnel, Timer, Tag, Heart, Clock, Play,
  InstagramLogo, FacebookLogo, XLogo, TiktokLogo, YoutubeLogo, LinkedinLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import FeedbackModal from '../components/FeedbackModal';
import { getFingerprint } from '../lib/fingerprint';
import { AllergenBadgeList } from '../components/AllergenIcon';
import { getTheme, type MenuTheme } from '../lib/themes';
import { getAllergenInfo, ALLERGEN_LIST, DIET_LIST } from '../lib/allergens';
import PromoPopup, { isPromoVisible, type Promo } from '../components/PromoPopup';
import { getLanguage, isRTL } from '../lib/languages';
import {
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_LABELS,
  NUTRI_SCORE_VALUES,
  nutriScoreTextColor,
  kcalToKj,
  sodiumToSalt,
  getRIPercent,
  getTrafficLight,
  TRAFFIC_LIGHT_COLORS,
  formatNutritionValue,
  type NutriScore,
} from '../lib/nutritionEU';
import { stripHtml } from '../lib/html';
import AnimatedLogo from '../components/AnimatedLogo';
import WaiterCallBar from '../components/WaiterCallBar';
import { useCart } from '../lib/useCart';
import QuantitySelector from '../components/QuantitySelector';
import CartBottomBar from '../components/CartBottomBar';
import CartDrawer from '../components/CartDrawer';
import { useLikes } from '../hooks/useLikes';
import { useCurrency } from '../hooks/useCurrency';
import CurrencyDropdown from '../components/CurrencyDropdown';
import { demoRestaurant, demoCategories, demoItems } from '../data/demoMenuData';
import type {
  LangCode,
  UiLangCode,
  Translations,
  Restaurant,
  MenuCategory,
  PeriodicDayVal,
  PeriodicScheduleVal,
  PriceVariant,
  Nutrition,
  MenuItem,
  RecRow,
} from '../types/menu';
import {
  toUiLang,
  hasVariants,
  minVariantPrice,
  formatPriceDisplay,
  variantDisplayName,
  isItemVisibleBySchedule,
  isHappyHourActive,
  parseVideoEmbed,
} from '../lib/menuHelpers';
import { NutriScoreBadge } from '../components/menu/NutriScoreBadge';
import { NutriScoreStrip } from '../components/menu/NutriScoreStrip';
import { FilterPanel } from '../components/menu/FilterPanel';
import { BentoCategoryCard } from '../components/menu/BentoCategoryCard';
import { NutritionFactsTable } from '../components/menu/NutritionFactsTable';

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

const isVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0];
  return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov');
};

const getVideoMimeType = (url: string): string => {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
};

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
  categories:   { tr: 'Kategoriler', en: 'Categories', ar: 'الفئات', zh: '分类' },
  backToCategories: { tr: 'Kategoriler', en: 'Categories', ar: 'الفئات', zh: '分类' },
  recommendations:  { tr: 'Yanında İyi Gider', en: 'Goes Well With', ar: 'يتناسب مع', zh: '搭配推荐' },
  itemsCount:   { tr: 'ürün', en: 'items', ar: 'عنصر', zh: '项' },
  viewMenu:     { tr: 'Menüyü Görüntüle', en: 'View Menu', ar: 'عرض القائمة', zh: '查看菜单' },
  allergens:    { tr: 'Alerjenler', en: 'Allergens', ar: 'مسببات الحساسية', zh: '过敏原' },
  startingFrom: { tr: "{price}'den başlayan", en: 'Starting from {price}', ar: 'يبدأ من {price}', zh: '起价 {price}' },
  currencyDisclaimer: {
    tr: '* Fiyatlar TCMB günlük kuru ile tahminidir',
    en: '* Prices are estimated using daily TCMB exchange rates',
    ar: '* الأسعار تقديرية وفق سعر صرف TCMB اليومي',
    zh: '* 价格按 TCMB 每日汇率估算',
  },
  sizeOptions:  { tr: 'Boyut Seçenekleri', en: 'Size Options', ar: 'خيارات الحجم', zh: '规格选项' },
  soldOut:      { tr: 'Tükendi', en: 'Sold Out', ar: 'نفد', zh: '售罄' },
  nutritionTitle:   { tr: 'Besin Değerleri', en: 'Nutrition Information', ar: 'معلومات غذائية', zh: '营养信息' },
  nutriScoreTitle:  { tr: 'Nutri-Score', en: 'Nutri-Score', ar: 'Nutri-Score', zh: 'Nutri-Score' },
  nutriScoreDesc:   { tr: 'Avrupa beslenme kalitesi skalası', en: 'European nutritional quality scale', ar: 'مقياس الجودة الغذائية الأوروبي', zh: '欧洲营养质量等级' },
  nutriScoreHealthier:  { tr: 'Daha sağlıklı', en: 'Healthier', ar: 'أصح', zh: '更健康' },
  nutriScoreLessHealthy: { tr: 'Daha az sağlıklı', en: 'Less healthy', ar: 'أقل صحة', zh: '不太健康' },
  nutriScoreDeclared:   { tr: 'İşletme tarafından beyan edilmiştir.', en: 'Declared by the establishment.', ar: 'تم التصريح من قبل المنشأة.', zh: '由商家声明。' },
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
  energy:           { tr: 'Enerji', en: 'Energy', ar: 'الطاقة', zh: '能量' },
  fat:              { tr: 'Yağ', en: 'Fat', ar: 'دهون', zh: '脂肪' },
  saturates:        { tr: 'doymuş yağ', en: 'of which saturates', ar: 'منها مشبعة', zh: '其中饱和脂肪' },
  carbs:            { tr: 'Karbonhidrat', en: 'Carbohydrate', ar: 'كربوهيدرات', zh: '碳水化合物' },
  ofWhichSugars:    { tr: 'şekerler', en: 'of which sugars', ar: 'منها سكريات', zh: '其中糖' },
  salt:             { tr: 'Tuz', en: 'Salt', ar: 'ملح', zh: '盐' },
  per100g:          { tr: '100g başına', en: 'per 100g', ar: 'لكل 100 جم', zh: '每100克' },
  perServing:       { tr: 'Porsiyon başına', en: 'per serving', ar: 'لكل حصة', zh: '每份' },
  referenceIntakeNote: {
    tr: '*Yetişkin referans alım değerleri (8400 kJ / 2000 kcal)',
    en: '*Reference intake of an average adult (8400 kJ / 2000 kcal)',
    ar: '*القيم المرجعية لبالغ متوسط (8400 kJ / 2000 سعرة)',
    zh: '*成年人参考摄入量（8400 kJ / 2000 卡路里）',
  },
  prepTime:         { tr: 'Hazırlanma Süresi', en: 'Prep Time', ar: 'وقت التحضير', zh: '准备时间' },
  minutes:          { tr: 'dk', en: 'min', ar: 'دقيقة', zh: '分钟' },
  // Feedback
  feedbackBtn:        { tr: 'Değerlendir', en: 'Rate Us', ar: 'قيّمنا', zh: '评价' },
  rateExperience:     { tr: 'Deneyiminizi Değerlendirin', en: 'Rate Your Experience', ar: 'قيّم تجربتك', zh: '评价您的体验' },
  shareExperience:    { tr: 'Düşünceleriniz bizim için değerli', en: 'Your thoughts matter to us', ar: 'رأيك يهمنا', zh: '您的想法对我们很重要' },
  yourName:           { tr: 'Adınız (isteğe bağlı)', en: 'Your name (optional)', ar: 'اسمك (اختياري)', zh: '您的姓名（可选）' },
  fbSubmit:           { tr: 'Gönder', en: 'Submit', ar: 'إرسال', zh: '提交' },
  thankYou:           { tr: 'Teşekkürler!', en: 'Thank You!', ar: 'شكراً!', zh: '谢谢！' },
  feedbackReceived:   { tr: 'Geri bildiriminiz alındı', en: 'Your feedback has been received', ar: 'تم استلام ملاحظاتك', zh: '已收到您的反馈' },
  feedbackReceivedLow:{ tr: 'Geri bildiriminiz için teşekkürler. Daha iyisini yapmak için çalışacağız.', en: 'Thanks for your feedback. We will work to do better.', ar: 'شكراً على ملاحظاتك، سنعمل لتقديم الأفضل.', zh: '感谢您的反馈，我们会努力做得更好。' },
  rateOnGoogle:       { tr: "Google'da Değerlendirin", en: 'Rate on Google', ar: 'قيّم على جوجل', zh: '在Google上评价' },
  googleHelps:        { tr: "Google'daki yorumunuz başkalarına da yardımcı olur.", en: 'Your Google review helps others too.', ar: 'مراجعتك على جوجل تساعد الآخرين أيضاً.', zh: '您在Google上的评价对其他人也有帮助。' },
  rateOnGoogleBtn:    { tr: "Google'da Yorum Yap", en: 'Review on Google', ar: 'مراجعة على جوجل', zh: '在Google上评价' },
  noThanks:           { tr: 'Hayır, Teşekkürler', en: 'No, Thanks', ar: 'لا، شكراً', zh: '不，谢谢' },
  ok:                 { tr: 'Tamam', en: 'OK', ar: 'حسناً', zh: '好的' },
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
  // Profile accordion
  showInfo:          { tr: 'İletişim bilgileri', en: 'Contact info', ar: 'معلومات الاتصال', zh: '联系信息' },
  hideInfo:          { tr: 'Bilgileri gizle', en: 'Hide info', ar: 'إخفاء المعلومات', zh: '隐藏信息' },
  // Like & Review
  like:              { tr: 'Beğen', en: 'Like', ar: 'إعجاب', zh: '点赞' },
  liked:             { tr: 'Beğendiniz', en: 'Liked', ar: 'أعجبك', zh: '已点赞' },
  reviewPromptTitle: { tr: 'Teşekkürler!', en: 'Thank you!', ar: '!شكراً', zh: '谢谢！' },
  reviewPromptText:  { tr: "Google Maps'te de yorum bırakmak ister misiniz?", en: 'Would you like to leave a review on Google Maps?', ar: 'هل ترغب في ترك تعليق على خرائط جوجل؟', zh: '您想在Google地图上留下评论吗？' },
  reviewButton:      { tr: "Google'da Yorum Yap", en: 'Review on Google', ar: 'تقييم على جوجل', zh: '在Google上评价' },
  notNow:            { tr: 'Şimdi değil', en: 'Not now', ar: 'ليس الآن', zh: '以后再说' },
  reviews:           { tr: 'yorum', en: 'reviews', ar: 'تعليق', zh: '评论' },
  writeReview:       { tr: 'Yorum Yaz', en: 'Write a Review', ar: 'اكتب تعليقاً', zh: '撰写评论' },
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
  const props = { size, weight: 'thin' as const };
  switch (type) {
    case 'instagram': return <InstagramLogo {...props} />;
    case 'facebook': return <FacebookLogo {...props} />;
    case 'x': return <XLogo {...props} />;
    case 'tiktok': return <TiktokLogo {...props} />;
    case 'youtube': return <YoutubeLogo {...props} />;
    case 'linkedin': return <LinkedinLogo {...props} />;
    case 'website': return <Globe {...props} />;
    case 'whatsapp': return <WhatsappLogo {...props} />;
    case 'google_maps': return <MapPin {...props} />;
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
  const [viewMode, setViewMode] = useState<'categories' | 'grid' | 'list'>('categories');
  const [viewModeInitialized, setViewModeInitialized] = useState(false);
  const [scrollActiveCategory, setScrollActiveCategory] = useState<string | null>(null);
  const isScrollingToCategory = useRef(false);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [activePromo, setActivePromo] = useState<Promo | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [demoThemeOverride, setDemoThemeOverride] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const cart = useCart();
  const currency = useCurrency(restaurant?.feature_multi_currency === true);
  const { format, formatTl } = currency;

  // Google Review prompt (triggered by product likes)
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

  // Profile info accordion
  const [infoOpen, setInfoOpen] = useState(false);

  // Product likes
  const { likeCounts, likedItems, toggleLike } = useLikes(restaurant?.id);
  const likesEnabled = restaurant?.feature_likes !== false;

  const theme = useMemo<MenuTheme>(
    () => getTheme(demoThemeOverride ?? restaurant?.theme_color),
    [demoThemeOverride, restaurant?.theme_color],
  );

  useEffect(() => {
    if (!restaurant || viewModeInitialized) return;
    const pref = restaurant.menu_view_mode;
    if (pref === 'grid' || pref === 'list' || pref === 'categories') {
      setViewMode(pref);
    }
    setViewModeInitialized(true);
  }, [restaurant, viewModeInitialized]);

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

  // Page view tracking — once per session per restaurant
  useEffect(() => {
    if (!restaurant?.id) return;
    const flagKey = `tabbled_pv_${restaurant.id}`;
    try {
      if (sessionStorage.getItem(flagKey)) return;
    } catch { /* ignore storage errors */ }
    const restaurantId = restaurant.id;
    (async () => {
      const { error } = await supabase.from('menu_page_views').insert({
        restaurant_id: restaurantId,
        fingerprint: getFingerprint(),
        table_number: table || null,
        language: lang,
        user_agent: (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 200),
      });
      if (error) {
        console.error('[Tabbled] menu_page_views insert failed:', error);
        return;
      }
      try { sessionStorage.setItem(flagKey, '1'); } catch { /* ignore */ }
    })();
  }, [restaurant?.id, table, lang]);

  useEffect(() => {
    if (!slug) return;
    const startTime = performance.now();
    const LOADING_MIN_MS = 500;

    // Static demo bypass: /menu/demo loads hardcoded data, no Supabase calls.
    if (slug === 'demo') {
      setRestaurant(demoRestaurant as unknown as Restaurant);
      setCategories(demoCategories as unknown as MenuCategory[]);
      setItems(demoItems as unknown as MenuItem[]);
      setPromos([]);
      const t = setTimeout(() => setLoading(false), LOADING_MIN_MS);
      return () => clearTimeout(t);
    }

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

  const headingFont = "'Roboto', sans-serif";
  const bodyFont = "'Roboto', sans-serif";

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#fff', fontFamily: bodyFont }}
      >
        <AnimatedLogo size={80} />
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
        {restaurant.splash_video_url ? (
          <>
            {coverImage && (
              <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <video
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              preload="auto"
              poster={coverImage || undefined}
              ref={(el) => {
                if (!el) return;
                el.muted = true;
                const p = el.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
              }}
              onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
              className="absolute inset-0 w-full h-full object-cover"
              src={restaurant.splash_video_url}
            />
            {null}
            <div
              className="absolute inset-0"
              style={{
                background: theme.key === 'black'
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
          </>
        ) : coverImage ? (
          <>
            {isVideoUrl(coverImageRaw) ? (
              <video
                key={coverImageRaw || undefined}
                autoPlay
                muted
                defaultMuted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
                poster={restaurant.logo_url || undefined}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  v.muted = true;
                  const p = v.play();
                  if (p && typeof p.catch === 'function') p.catch(() => {});
                }}
                onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
              >
                <source src={coverImageRaw!} type={getVideoMimeType(coverImageRaw!)} />
              </video>
            ) : (
              <img onError={handleImageError} src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
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
            <div className="flex items-center mb-8" style={{ gap: 12 }}>
              {socials.map(({ type, url }) => {
                const iconBg = coverImage
                  ? 'rgba(255,255,255,0.2)'
                  : theme.key === 'black'
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.06)';
                const iconColor = coverImage || theme.key === 'black' ? '#FFFFFF' : theme.text;
                const iconBorder = coverImage
                  ? '1px solid rgba(255,255,255,0.25)'
                  : theme.key === 'black'
                    ? '1px solid rgba(255,255,255,0.15)'
                    : '1px solid rgba(0,0,0,0.08)';
                return (
                  <a
                    key={type}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{ width: 36, height: 36, backgroundColor: iconBg, color: iconColor, border: iconBorder }}
                  >
                    <SocialIcon type={type} size={18} />
                  </a>
                );
              })}
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
            <img src="/tabbled-logo-horizontal.png" alt="Tabbled" className="h-5 w-auto block brightness-0 invert opacity-60" />
          </a>
        </div>

        {/* Floating Feedback Pill */}
        {restaurant.feature_feedback !== false && (
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            aria-label={UI.feedbackBtn[toUiLang(lang)]}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '8px 16px',
              borderRadius: 24,
              backgroundColor: 'rgba(28,28,30,0.8)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              zIndex: 50,
            }}
          >
            <Star size={16} weight="thin" />
            <span>{UI.feedbackBtn[toUiLang(lang)]}</span>
          </button>
        )}

        {showFeedback && (
          <FeedbackModal
            restaurantId={restaurant.id}
            googlePlaceId={restaurant.google_place_id}
            tableNumber={table}
            lang={lang}
            theme={theme}
            ui={{
              rateExperience: UI.rateExperience[toUiLang(lang)],
              shareExperience: UI.shareExperience[toUiLang(lang)],
              yourName: UI.yourName[toUiLang(lang)],
              submit: UI.fbSubmit[toUiLang(lang)],
              thankYou: UI.thankYou[toUiLang(lang)],
              feedbackReceived: UI.feedbackReceived[toUiLang(lang)],
              feedbackReceivedLow: UI.feedbackReceivedLow[toUiLang(lang)],
              rateOnGoogle: UI.rateOnGoogle[toUiLang(lang)],
              googleHelps: UI.googleHelps[toUiLang(lang)],
              rateOnGoogleBtn: UI.rateOnGoogleBtn[toUiLang(lang)],
              noThanks: UI.noThanks[toUiLang(lang)],
              ok: UI.ok[toUiLang(lang)],
            }}
            onClose={() => setShowFeedback(false)}
          />
        )}
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

  const isDemo = slug === 'demo';

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: bodyFont }}
    >
      {isDemo && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 60,
            background: 'linear-gradient(90deg, #FF4F7A 0%, #E8456E 100%)',
            color: '#fff',
            textAlign: 'center',
            padding: '10px 16px',
            fontSize: 13,
            fontFamily: "'Roboto', sans-serif",
            fontWeight: 500,
          }}
        >
          <div>
            🎉 Bu bir demo menüdür.{' '}
            <a
              href="/login"
              style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', marginLeft: 4 }}
            >
              14 gün ücretsiz deneyin →
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Tema:</span>
            {(['white', 'black'] as const).map((t) => {
              const isActive = (demoThemeOverride ?? restaurant.theme_color ?? 'white') === t;
              const bg = t === 'white' ? '#F7F7F8' : '#1C1C1E';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDemoThemeOverride(t)}
                  aria-label={`Tema: ${t}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: bg,
                    border: `2px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
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
          {JSON.stringify(
            JSON.parse(
              JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Restaurant',
                '@id': `${canonicalUrl}#restaurant`,
                name: restaurant.name,
                url: canonicalUrl,
                description: restaurant.tagline || `${restaurant.name} dijital menüsü`,
                address: restaurant.address
                  ? {
                      '@type': 'PostalAddress',
                      streetAddress: restaurant.address,
                      addressCountry: 'TR',
                    }
                  : undefined,
                telephone: restaurant.phone || undefined,
                image: ogImage || undefined,
                menu: canonicalUrl,
                acceptsReservations: false,
                priceRange: '₺₺',
                hasMenu: { '@type': 'Menu', url: canonicalUrl },
                sameAs: restaurant.google_place_id
                  ? [`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`]
                  : undefined,
                potentialAction: {
                  '@type': 'ViewAction',
                  target: canonicalUrl,
                  name: 'Menüyü Görüntüle',
                },
              })
            )
          )}
        </script>
      </Helmet>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-44" style={{ backgroundColor: theme.cardBg }}>
          {isVideoUrl(coverImageRaw) ? (
            <video
              key={coverImageRaw || undefined}
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              controls={false}
              poster={restaurant.logo_url || undefined}
              className="w-full h-full object-cover opacity-80"
              style={{ pointerEvents: 'none' }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                v.muted = true;
                const p = v.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
              }}
              onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
            >
              <source src={coverImageRaw!} type={getVideoMimeType(coverImageRaw!)} />
            </video>
          ) : (
            <img onError={handleImageError} src={coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          )}
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
              {/* Google Rating — always visible */}
              {restaurant.google_rating && restaurant.google_place_id && (
                <div className="flex flex-col items-start gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={18}
                          weight={restaurant.google_rating! >= s ? "fill" : "regular"}
                          style={{ color: restaurant.google_rating! >= s - 0.5 ? '#F59E0B' : theme.mutedText, opacity: restaurant.google_rating! >= s - 0.5 ? 1 : 0.3 }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold" style={{ color: theme.text }}>
                      {restaurant.google_rating.toFixed(1)}
                    </span>
                    {(restaurant.google_review_count ?? 0) > 0 && (
                      <span className="text-xs" style={{ color: theme.mutedText }}>
                        ({restaurant.google_review_count} {UI.reviews[toUiLang(lang)]})
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                    style={{ color: theme.mutedText, borderColor: theme.mutedText + '44' }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {UI.writeReview[toUiLang(lang)]}
                  </a>
                </div>
              )}
              {/* Info accordion toggle */}
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="flex items-center gap-1 mt-2 text-xs transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: theme.mutedText }}
              >
                <span>{infoOpen ? (UI.hideInfo[toUiLang(lang)]) : (UI.showInfo[toUiLang(lang)])}</span>
                <CaretDown
                  size={12}
                  style={{ transition: 'transform 0.2s', transform: infoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {/* Accordion content */}
              {infoOpen && (
                <div className="flex flex-col gap-2 mt-2 text-sm animate-fadeIn" style={{ color: theme.mutedText }}>
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
                  {socials.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
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
                </div>
              )}
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
            <div className="flex items-center gap-2 flex-wrap">
              {availableLanguages.length > 1 && (
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
              )}
              {currency.visible && (
                <CurrencyDropdown
                  available={currency.available}
                  selected={currency.selected}
                  onSelect={currency.setCurrency}
                  lang={toUiLang(lang)}
                  theme={theme}
                  variant="header"
                />
              )}
            </div>

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
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[480px] mx-auto pb-20" style={{ padding: '16px 16px 80px' }}>
        {effectiveActiveCategory && (
          <button
            onClick={() => { setActiveCategory(null); setViewMode('categories'); window.scrollTo({ top: 0 }); }}
            className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{
              marginBottom: 12,
              color: theme.mutedText,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              padding: '4px 0',
              cursor: 'pointer',
            }}
          >
            <CaretLeft size={16} weight="thin" />
            <span>{UI.backToCategories[toUiLang(lang)]}</span>
          </button>
        )}
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
        ) : viewMode === 'categories' && !effectiveActiveCategory && !filterApplied && visibleCategories.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visibleCategories.map((cat, idx) => {
              const isFull = idx % 5 === 0;
              const isRightInPair = !isFull && ((idx % 5) % 2 === 0);
              return (
                <BentoCategoryCard
                  key={cat.id}
                  cat={cat}
                  count={categoryCountMap.get(cat.id) ?? 0}
                  lang={lang}
                  theme={theme}
                  headingFont={headingFont}
                  isFull={isFull}
                  delay={isRightInPair ? 100 : 0}
                  itemsLabel={UI.itemsCount[toUiLang(lang)]}
                  onClick={() => { setActiveCategory(cat.id); setViewMode('list'); window.scrollTo({ top: 0 }); }}
                />
              );
            })}
          </div>
        ) : effectiveActiveCategory ? (
          (() => {
            const activeChildren = childrenOf(effectiveActiveCategory);
            if (activeChildren.length === 0) {
              return (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2' : 'flex flex-col'} style={{ gap: 8 }}>
                  {filteredItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} likeCount={likeCounts[item.id]} isLiked={likedItems.has(item.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
                      <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} likeCount={likeCounts[item.id]} isLiked={likedItems.has(item.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
                            <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} likeCount={likeCounts[item.id]} isLiked={likedItems.has(item.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
                  <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} likeCount={likeCounts[item.id]} isLiked={likedItems.has(item.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
                      <MenuItemCard key={item.id} item={item} lang={lang} theme={theme} onSelect={setSelectedItem} viewMode={viewMode} onAddToCart={handleCardAdd} cartQty={cart.getItemQuantity(item.id)} likeCount={likeCounts[item.id]} isLiked={likedItems.has(item.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
                <img src="/tabbled-logo-horizontal.png" alt="Tabbled" className={`h-4 w-auto block ${theme.key === 'black' ? 'brightness-0 invert opacity-70' : ''}`} />
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
          format={format}
          currencySymbol={currency.selectedRate.symbol || '₺'}
          currencyDisclaimer={currency.visible && !currency.isTry ? UI.currencyDisclaimer[toUiLang(lang)] : null}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal item={selectedItem} allItems={items} lang={lang} theme={theme} onClose={() => setSelectedItem(null)} onSelectItem={setSelectedItem} onAddToCart={cartEnabled ? handleAddToCart : undefined} likeCount={likeCounts[selectedItem.id]} isLiked={likedItems.has(selectedItem.id)} onLike={likesEnabled ? async (id) => { const ok = await toggleLike(id, restaurant!.id); if (ok && restaurant?.google_place_id) setTimeout(() => setShowReviewPrompt(true), 800); } : undefined} format={format} />
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
/*  Menu Item Card                                                     */
/* ------------------------------------------------------------------ */

const SOLD_OUT_LABELS: Record<UiLangCode, string> = {
  tr: 'Tükendi', en: 'Sold Out', ar: 'نفد', zh: '售罄',
};

function MenuItemCard({ item, lang, theme, onSelect, viewMode = 'list', onAddToCart, cartQty, likeCount, isLiked, onLike, format }: { item: MenuItem; lang: LangCode; theme: MenuTheme; onSelect: (item: MenuItem) => void; viewMode?: 'categories' | 'grid' | 'list'; onAddToCart?: (item: MenuItem) => void; cartQty?: number; likeCount?: number; isLiked?: boolean; onLike?: (itemId: string) => void; format: (n: number) => string }) {
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasBadges = item.is_popular || item.is_new || item.is_vegetarian;
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const headingFont = "'Roboto', sans-serif";
  const bodyFont = "'Roboto', sans-serif";
  const isFeatured = item.is_featured;
  const isSoldOut = item.is_sold_out;
  const displayCalories = item.nutrition?.calories ?? item.calories ?? null;
  const prepTime = item.prep_time ?? null;
  const minutesLabel = UI.minutes[toUiLang(lang)];
  const soldOutLabel = SOLD_OUT_LABELS[toUiLang(lang)];
  const soldOutWrapperStyle: React.CSSProperties = isSoldOut ? { opacity: 0.5 } : {};
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
      <span style={{ fontSize: 11, textDecoration: 'line-through', color: theme.mutedText }}>{format(originalPrice)}</span>
      <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, color: '#FF4F7A' }}>{format(hhp)}</span>
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
  const cartAccent = '#FF4F7A';

  const LikeButton = onLike ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onLike(item.id); }}
      className="flex items-center gap-1 transition-colors"
      style={{ background: 'none', border: 'none', cursor: isLiked ? 'default' : 'pointer', padding: 0, color: isLiked ? '#FF4F7A' : theme.mutedText, fontSize: 12 }}
    >
      <Heart size={16} weight={isLiked ? 'fill' : 'regular'} />
      {(likeCount ?? 0) > 0 && <span>{likeCount}</span>}
    </button>
  ) : null;

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
        className="overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98]"
        style={{ borderRadius: 12, backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow, gridColumn: viewMode === 'grid' ? 'span 2' : undefined, ...soldOutWrapperStyle }}
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
                {formatPriceDisplay(item, toUiLang(lang), format)}
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
          {(displayCalories != null || prepTime != null || hasAllergens || item.nutri_score) && (
            <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.divider}`, position: 'relative' }}>
              <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: theme.mutedText, fontWeight: 300 }}>
                {displayCalories != null && <span>{displayCalories} kcal</span>}
                {item.nutri_score && (
                  <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} size={18} />
                )}
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
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            {LikeButton || <span />}
            {AddButton}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Grid card ---- */
  if (viewMode === 'grid') {
    return (
      <div
        className="overflow-hidden transition-all duration-200 cursor-pointer active:scale-[0.98]"
        style={{ borderRadius: 12, backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.cardShadow, ...soldOutWrapperStyle }}
        onClick={() => onSelect(item)}
      >
        <div className="relative">
          {item.image_url ? (
            <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt={name} className="w-full object-cover" style={{ aspectRatio: '1 / 1' }} loading="lazy" decoding="async" />
          ) : (
            <div
              className="w-full flex items-center justify-center"
              style={{ aspectRatio: '1 / 1', backgroundColor: `${theme.accent}15` }}
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
              {formatPriceDisplay(item, toUiLang(lang), format)}
            </span>
          )}
          {(displayCalories != null || prepTime != null || item.nutri_score) && (
            <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
              <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: theme.mutedText }}>
                {displayCalories != null && <span>{displayCalories} kcal</span>}
                {item.nutri_score && (
                  <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} size={20} />
                )}
                {displayCalories != null && prepTime != null && <span> · </span>}
                {prepTime != null && <span>{prepTime} {minutesLabel}</span>}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            {LikeButton || <span />}
            {AddButton}
          </div>
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
        borderRadius: 12,
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
        ...soldOutWrapperStyle,
      }}
      onClick={() => onSelect(item)}
    >
      <div className="relative flex-shrink-0">
        {item.image_url ? (
          <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'card')} alt={name} className="object-cover" style={{ width: 96, height: 96, borderRadius: 12 }} loading="lazy" decoding="async" />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: `${theme.accent}15` }}
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
            style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 16, lineHeight: 1.3, color: theme.text }}
          >
            {name || <span className="italic" style={{ color: theme.mutedText }}>—</span>}
          </h3>
          {hhPrice != null ? renderHHPrice(Number(item.price), hhPrice) : (
            <span
              className="flex-shrink-0 tabular-nums"
              style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16, color: theme.price, ...soldOutPriceStyle }}
            >
              {formatPriceDisplay(item, toUiLang(lang), format)}
            </span>
          )}
        </div>
        {SoldOutBadge && <div style={{ marginTop: 4 }}>{SoldOutBadge}</div>}
        {description && (
          <p className="line-clamp-2" style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 300, lineHeight: 1.5, color: theme.mutedText, marginTop: 4 }}>
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
        {(displayCalories != null || prepTime != null || hasAllergens || item.nutri_score) && (
          <div className="flex items-center justify-between mt-auto" style={{ paddingTop: 4 }}>
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: theme.mutedText, fontWeight: 300 }}>
              {displayCalories != null && <span>{displayCalories} kcal</span>}
              {item.nutri_score && (
                <NutriScoreBadge score={item.nutri_score} lang={lang} theme={theme} size={20} />
              )}
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
        <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: 4 }}>
          {LikeButton || <span />}
          {AddButton}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Item Detail Modal                                                  */
/* ------------------------------------------------------------------ */

function ItemDetailModal({ item, allItems, lang, theme, onClose, onSelectItem, onAddToCart, likeCount, isLiked, onLike, format }: { item: MenuItem; allItems?: MenuItem[]; lang: LangCode; theme: MenuTheme; onClose: () => void; onSelectItem?: (item: MenuItem) => void; onAddToCart?: (item: MenuItem, variant?: string, price?: number) => void; likeCount?: number; isLiked?: boolean; onLike?: (itemId: string) => void; format: (n: number) => string }) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(hasVariants(item) ? null : 0);
  const [modalQty, setModalQty] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [recommendations, setRecommendations] = useState<RecRow[]>([]);
  const video = parseVideoEmbed(item.video_url);

  // Track view duration: record when modal closes (min 2s, max 300s)
  useEffect(() => {
    const openedAt = Date.now();
    const itemId = item.id;
    const restaurantId = item.restaurant_id;
    return () => {
      const duration = Math.round((Date.now() - openedAt) / 1000);
      if (duration < 2 || duration > 300) return;
      void supabase.from('menu_item_views').insert({
        menu_item_id: itemId,
        restaurant_id: restaurantId,
        fingerprint: getFingerprint(),
        duration_seconds: duration,
      });
    };
  }, [item.id, item.restaurant_id]);

  useEffect(() => {
    setShowVideo(false);
    setSelectedVariant(hasVariants(item) ? null : 0);
    setModalQty(1);
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('item_recommendations')
          .select('recommended_item_id, reason_tr, reason_en, sort_order')
          .eq('menu_item_id', item.id)
          .order('sort_order');
        if (!cancelled) setRecommendations((data as RecRow[]) ?? []);
      } catch {
        if (!cancelled) setRecommendations([]);
      }
    })();
    return () => { cancelled = true; };
  }, [item.id]);

  const recItems = recommendations
    .map((r) => {
      const it = allItems?.find((x) => x.id === r.recommended_item_id);
      return it ? { item: it, reason_tr: r.reason_tr, reason_en: r.reason_en } : null;
    })
    .filter((x): x is { item: MenuItem; reason_tr: string | null; reason_en: string | null } => x !== null);
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasAllergens = item.allergens && item.allergens.length > 0;
  const headingFont = "'Roboto', sans-serif";
  const bodyFont = "'Roboto', sans-serif";
  const happyHour = !item.is_sold_out && isHappyHourActive(item);
  const isVariant = hasVariants(item);
  const cartAccent = '#FF4F7A';
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

        {video && showVideo ? (
          <div className="w-full rounded-t-3xl overflow-hidden" style={{ background: '#000' }}>
            {video.type === 'direct' ? (
              <video src={video.src} controls autoPlay style={{ width: '100%', maxHeight: 240, display: 'block' }} />
            ) : (
              <iframe
                src={video.src}
                style={{ width: '100%', aspectRatio: '16/9', maxHeight: 240, border: 'none', display: 'block' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={name}
              />
            )}
          </div>
        ) : item.image_url ? (
          <div className="relative">
            <img onError={handleImageError} src={getOptimizedImageUrl(item.image_url, 'detail')} alt={name} className="w-full h-64 object-cover rounded-t-3xl sm:rounded-t-3xl" loading="lazy" decoding="async" />
            {video && (
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                aria-label="Play video"
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                style={{ background: 'rgba(0,0,0,0.15)', cursor: 'pointer', border: 'none' }}
              >
                <span
                  className="flex items-center justify-center"
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)', color: '#1C1C1E',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <Play size={28} weight="fill" />
                </span>
              </button>
            )}
          </div>
        ) : video ? (
          <button
            type="button"
            onClick={() => setShowVideo(true)}
            aria-label="Play video"
            className="w-full flex items-center justify-center rounded-t-3xl"
            style={{ height: 192, backgroundColor: `${theme.accent}15`, border: 'none', cursor: 'pointer' }}
          >
            <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: '#1C1C1E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <Play size={28} weight="fill" />
            </span>
          </button>
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
                  <span style={{ fontSize: 13, textDecoration: 'line-through', color: theme.mutedText }}>{format(Number(item.price))}</span>
                  <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 20, color: '#FF4F7A' }}>{format(hhPrice)}</span>
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
                  {format(Number(item.price))}
                </span>
              )
            )}
          </div>

          {/* Like button in detail modal */}
          {onLike && (
            <button
              type="button"
              onClick={() => onLike(item.id)}
              className="flex items-center gap-1.5 mb-3 transition-colors"
              style={{ background: 'none', border: 'none', cursor: isLiked ? 'default' : 'pointer', padding: 0, color: isLiked ? '#FF4F7A' : theme.mutedText, fontSize: 13, fontWeight: 500 }}
            >
              <Heart size={20} weight={isLiked ? 'fill' : 'regular'} />
              <span>
                {isLiked ? UI.liked[toUiLang(lang)] : UI.like[toUiLang(lang)]}
                {(likeCount ?? 0) > 0 && ` (${likeCount})`}
              </span>
            </button>
          )}

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
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description || '') }}
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
                      <span style={{ fontSize: 11, textDecoration: 'line-through', color: theme.mutedText }}>{format(Number(v.price))}</span>
                      <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 700, color: '#FF4F7A' }}>{format(Number((v as any).happy_hour_price))}</span>
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
                      {format(Number(v.price))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasVariants(item) && !(item.nutrition && item.nutrition.show_on_menu !== false) && (item.nutrition?.calories ?? item.calories) != null && (
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: theme.mutedText, position: 'relative' }}>
              <Thermometer size={16} />
              <span>{item.nutrition?.calories ?? item.calories} kcal</span>
            </div>
          )}
          {!hasVariants(item) && item.nutri_score && (
            <NutriScoreStrip score={item.nutri_score} lang={lang} theme={theme} />
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
                        <span style={{ fontWeight: 600, color: sel ? cartAccent : theme.price }}>{format(Number(v.price))}</span>
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
                  {UI.addToCart[toUiLang(lang)]} — {format(
                    (isVariant && selectedVariant !== null
                      ? Number(item.price_variants[selectedVariant].price)
                      : Number(item.price)
                    ) * modalQty
                  )}
                </button>
              </div>
            </div>
          )}

          {recItems.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${theme.divider}` }}>
              <h3 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: theme.text, marginBottom: 12 }}>
                {UI.recommendations[toUiLang(lang)]}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recItems.map(({ item: rec, reason_tr, reason_en }) => {
                  const reason = toUiLang(lang) === 'tr' ? reason_tr : (reason_en || reason_tr);
                  const recName = t(rec.translations, 'name', rec.name_tr, lang);
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSelectItem?.(rec)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: 8, borderRadius: 12,
                        background: theme.cardBg,
                        border: `1px solid ${theme.cardBorder}`,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      {rec.image_url ? (
                        <img onError={handleImageError} src={getOptimizedImageUrl(rec.image_url, 'thumbnail')} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 8, background: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: headingFont, fontWeight: 700, color: theme.mutedText }}>
                          {recName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 14, color: theme.text, lineHeight: 1.3 }}>
                          {recName}
                        </div>
                        {reason && (
                          <div style={{ fontFamily: bodyFont, fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: theme.mutedText, marginTop: 2, lineHeight: 1.4 }}>
                            {reason}
                          </div>
                        )}
                      </div>
                      <span className="tabular-nums" style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 14, color: theme.price, flexShrink: 0 }}>
                        {formatPriceDisplay(rec, toUiLang(lang), format)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


