import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  CiWheat, CiDroplet, CiCircleAlert, CiApple, CiLemon, CiStar,
  CiTempHigh, CiWavePulse1, CiMapPin, CiPhone, CiGlobe,
  CiForkAndKnife, CiCircleRemove,
} from 'react-icons/ci';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LangCode = 'tr' | 'en' | 'ar' | 'zh';

interface Translations {
  [lang: string]: { name?: string; description?: string; tagline?: string };
}

interface Restaurant {
  id: string; name: string; slug: string;
  logo_url: string | null; cover_url: string | null; cover_image_url: string | null;
  address: string | null; phone: string | null; is_active: boolean;
  description_tr: string | null; tagline: string | null;
  enabled_languages: string[]; translations: Translations;
  social_instagram: string | null; social_facebook: string | null;
  social_x: string | null; social_tiktok: string | null; social_website: string | null;
}

interface MenuCategory {
  id: string; restaurant_id: string; name_tr: string; description_tr: string | null;
  sort_order: number; is_active: boolean; translations: Translations;
}

interface MenuItem {
  id: string; restaurant_id: string; category_id: string;
  name_tr: string; description_tr: string | null; price: number;
  image_url: string | null; is_available: boolean; is_popular: boolean;
  is_new: boolean; is_vegetarian: boolean;
  allergens: string[] | null; calories: number | null;
  sort_order: number; translations: Translations;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function t(translations: Translations | null | undefined, field: string, fallback: string | null | undefined, lang: LangCode): string {
  if (lang === 'tr') return fallback ?? '';
  const val = translations?.[lang]?.[field as keyof Translations[string]];
  if (val && typeof val === 'string' && val.trim() !== '') return val;
  return fallback ?? '';
}

const LANG_LABELS: Record<LangCode, string> = { tr: 'Türkçe', en: 'English', ar: 'العربية', zh: '中文' };

const ALLERGEN_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; label: Record<LangCode, string>; color: string; bg: string }> = {
  gluten:  { icon: CiWheat,       label: { tr: 'Gluten', en: 'Gluten', ar: 'غلوتين', zh: '麸质' },         color: '#B45309', bg: '#FEF3C7' },
  dairy:   { icon: CiDroplet,     label: { tr: 'Süt', en: 'Dairy', ar: 'ألبان', zh: '乳制品' },           color: '#1D4ED8', bg: '#DBEAFE' },
  egg:     { icon: CiCircleAlert, label: { tr: 'Yumurta', en: 'Egg', ar: 'بيض', zh: '鸡蛋' },            color: '#B45309', bg: '#FEF9C3' },
  nuts:    { icon: CiApple,       label: { tr: 'Kuruyemiş', en: 'Nuts', ar: 'مكسرات', zh: '坚果' },      color: '#9A3412', bg: '#FFEDD5' },
  seafood: { icon: CiWavePulse1,  label: { tr: 'Deniz Ürünü', en: 'Seafood', ar: 'مأكولات بحرية', zh: '海鲜' }, color: '#0E7490', bg: '#CFFAFE' },
  soy:     { icon: CiLemon,       label: { tr: 'Soya', en: 'Soy', ar: 'صويا', zh: '大豆' },              color: '#4D7C0F', bg: '#ECFCCB' },
  spicy:   { icon: CiTempHigh,    label: { tr: 'Acı', en: 'Spicy', ar: 'حار', zh: '辣' },                color: '#DC2626', bg: '#FEF2F2' },
};

const UI: Record<string, Record<LangCode, string>> = {
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
};

/* ------------------------------------------------------------------ */
/*  Social Media SVG Icons (inline, no extra deps)                     */
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
  const langParam = (searchParams.get('lang') as LangCode) || 'tr';

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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
    const fetchData = async () => {
      setLoading(true);
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).eq('is_active', true).single();
      if (!rest) { setLoading(false); return; }
      setRestaurant(rest);
      const [{ data: cats }, { data: menuItems }] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('restaurant_id', rest.id).eq('is_active', true).order('sort_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', rest.id).eq('is_available', true).order('sort_order'),
      ]);
      setCategories(cats ?? []);
      setItems(menuItems ?? []);
      setLoading(false);
    };
    fetchData();
  }, [slug]);

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#A8B977] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm tracking-wide">{UI.loading[lang]}</p>
        </div>
      </div>
    );
  }

  /* ---- Not found ---- */
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#422B21]/10 flex items-center justify-center">
          <CiForkAndKnife size={32} className="text-[#422B21]/40" />
        </div>
        <p className="font-bold text-lg text-[#1A1A1A]">{UI.notFound[lang]}</p>
        <a href="https://tabbled.com" className="text-[#A8B977] font-medium text-sm hover:underline">tabbled.com</a>
      </div>
    );
  }

  const coverImage = restaurant.cover_image_url || restaurant.cover_url;
  const socials = [
    { type: 'instagram', url: restaurant.social_instagram },
    { type: 'facebook', url: restaurant.social_facebook },
    { type: 'x', url: restaurant.social_x },
    { type: 'tiktok', url: restaurant.social_tiktok },
    { type: 'website', url: restaurant.social_website },
  ].filter(s => s.url);

  /* ================================================================ */
  /*  SPLASH SCREEN                                                    */
  /* ================================================================ */

  if (showSplash) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {/* Background */}
        {coverImage ? (
          <>
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#422B21] via-[#5C3D2E] to-[#422B21]" />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-[400px]">
          {/* Logo */}
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-white/20 shadow-2xl mb-6"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl bg-[#A8B977] flex items-center justify-center border-2 border-white/20 shadow-2xl mb-6">
              <span className="font-bold text-4xl text-white">{restaurant.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">{restaurant.name}</h1>

          {/* Tagline */}
          {restaurant.tagline && (
            <p className="text-white/70 text-sm font-light mb-6 leading-relaxed">
              {t(restaurant.translations, 'tagline', restaurant.tagline, lang)}
            </p>
          )}

          {/* Table badge */}
          {table && (
            <div className="bg-[#A8B977] text-white text-sm font-bold px-5 py-2 rounded-xl mb-6 shadow-lg">
              {UI.table[lang]} {table}
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
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                >
                  <SocialIcon type={type} size={18} />
                </a>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={() => setShowSplash(false)}
            className="bg-[#A8B977] hover:bg-[#96A768] text-white font-bold text-base px-10 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            {UI.viewMenu[lang]}
          </button>

          {/* Language switcher on splash */}
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2 mt-6">
              <CiGlobe size={14} className="text-white/40" />
              <div className="flex gap-1">
                {availableLanguages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      lang === l ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Powered by */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/30 text-xs">
            Powered by{' '}
            <a href="https://tabbled.com" className="text-white/50 font-medium hover:text-white/70 transition-colors">Tabbled</a>
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  MENU VIEW                                                        */
  /* ================================================================ */

  const filteredItems = activeCategory ? items.filter((i) => i.category_id === activeCategory) : items;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const groupedItems: { category: MenuCategory | null; items: MenuItem[] }[] = [];

  if (!activeCategory) {
    const catOrder = new Map(categories.map((c, i) => [c.id, i]));
    const groups = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      const key = item.category_id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    const sortedKeys = [...groups.keys()].sort((a, b) => (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999));
    for (const key of sortedKeys) {
      groupedItems.push({ category: categoryMap.get(key) ?? null, items: groups.get(key)! });
    }
  }

  const hasNoItems = filteredItems.length === 0 && !activeCategory && items.length === 0;

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-44 bg-[#422B21]">
          <img src={coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#422B21] via-[#422B21]/40 to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className={`bg-[#422B21] text-white px-4 ${coverImage ? '-mt-20 relative z-10 pt-4 pb-5' : 'py-6'}`}>
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-start gap-4">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-white/20 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#A8B977] flex items-center justify-center flex-shrink-0 border-2 border-white/20 shadow-lg">
                <span className="font-bold text-2xl text-white">{restaurant.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="font-bold text-xl leading-tight">{restaurant.name}</h1>
              {restaurant.tagline && (
                <p className="text-white/50 text-xs mt-1 font-light leading-relaxed">
                  {t(restaurant.translations, 'tagline', restaurant.tagline, lang)}
                </p>
              )}
              <div className="flex flex-col gap-0.5 mt-2">
                {restaurant.address && (
                  <p className="text-white/60 text-xs flex items-center gap-1.5">
                    <CiMapPin size={13} className="flex-shrink-0 text-white/40" />
                    <span className="truncate">{restaurant.address}</span>
                  </p>
                )}
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="text-white/60 text-xs flex items-center gap-1.5 hover:text-white/80 transition-colors">
                    <CiPhone size={13} className="flex-shrink-0 text-white/40" />
                    {restaurant.phone}
                  </a>
                )}
              </div>
              {/* Social icons in header */}
              {socials.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {socials.map(({ type, url }) => (
                    <a key={type} href={url!} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/70 transition-colors">
                      <SocialIcon type={type} size={14} />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {table && (
              <span className="bg-[#A8B977] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 shadow-sm">
                {UI.table[lang]} {table}
              </span>
            )}
          </div>

          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <CiGlobe size={14} className="text-white/40" />
              <div className="flex gap-1">
                {availableLanguages.map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${lang === l ? 'bg-[#A8B977] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Category Tab Bar */}
      <div className="sticky top-0 z-20 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-[#E8E6E0]">
        <div className="max-w-[480px] mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => setActiveCategory(null)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === null ? 'bg-[#422B21] text-white shadow-sm' : 'bg-white border border-[#E8E6E0] text-[#6B7280] hover:border-[#422B21]/30'}`} style={{ scrollSnapAlign: 'start' }}>
              {UI.all[lang]}
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id ? 'bg-[#422B21] text-white shadow-sm' : 'bg-white border border-[#E8E6E0] text-[#6B7280] hover:border-[#422B21]/30'}`} style={{ scrollSnapAlign: 'start' }}>
                {t(cat.translations, 'name', cat.name_tr, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 py-4 pb-20">
        {hasNoItems ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#A8B977]/10 flex items-center justify-center mx-auto mb-3">
              <CiForkAndKnife size={28} className="text-[#A8B977]/50" />
            </div>
            <p className="text-[#9CA3AF] text-sm">{UI.noItems[lang]}</p>
          </div>
        ) : activeCategory ? (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} lang={lang} onSelect={setSelectedItem} />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-center text-[#9CA3AF] text-sm py-8">{UI.noItemsInCat[lang]}</p>
            )}
          </div>
        ) : (
          groupedItems.map(({ category, items: catItems }) => (
            <div key={category?.id ?? 'other'} className="mb-6">
              <div className="flex items-center gap-3 mb-3 pt-2">
                <h2 className="text-sm font-bold text-[#422B21] tracking-wide uppercase">
                  {category ? t(category.translations, 'name', category.name_tr, lang) : UI.other[lang]}
                </h2>
                <div className="flex-1 h-px bg-[#E8E6E0]" />
                <span className="text-[11px] text-[#9CA3AF] font-medium bg-[#F3F2EE] px-2 py-0.5 rounded-full">{catItems.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} lang={lang} onSelect={setSelectedItem} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#FAFAF7]/95 backdrop-blur-sm border-t border-[#E8E6E0] py-3 z-10">
        <p className="text-center text-[#9CA3AF] text-xs">
          Powered by{' '}
          <a href="https://tabbled.com" className="text-[#A8B977] font-medium hover:underline">Tabbled</a>
        </p>
      </footer>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal item={selectedItem} lang={lang} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Menu Item Card                                                     */
/* ------------------------------------------------------------------ */

function MenuItemCard({ item, lang, onSelect }: { item: MenuItem; lang: LangCode; onSelect: (item: MenuItem) => void }) {
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasBadges = item.is_popular || item.is_new || item.is_vegetarian;
  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <div
      className="bg-white border border-[#E8E6E0] rounded-2xl p-3 flex gap-3 hover:shadow-md hover:border-[#D5D3CC] transition-all duration-200 cursor-pointer active:scale-[0.99]"
      onClick={() => onSelect(item)}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={name} className="w-[88px] h-[88px] rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-[88px] h-[88px] rounded-xl flex-shrink-0 bg-gradient-to-br from-[#A8B977]/15 to-[#E4A07A]/15 flex items-center justify-center">
          <CiForkAndKnife size={28} className="text-[#A8B977]/30" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] text-[#1A1A1A] leading-snug line-clamp-2">
            {name || <span className="text-[#9CA3AF] italic">—</span>}
          </h3>
          <span className="text-[15px] font-bold text-[#A8B977] flex-shrink-0 tabular-nums">
            {Number(item.price).toFixed(2)} ₺
          </span>
        </div>
        {description && (
          <p className="text-[12px] text-[#6B7280] font-light mt-1 line-clamp-2 leading-relaxed">{description}</p>
        )}
        {hasBadges && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {item.is_popular && (
              <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#B45309] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <CiStar size={11} /> {UI.popular[lang]}
              </span>
            )}
            {item.is_new && (
              <span className="inline-flex items-center gap-0.5 bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-semibold px-2 py-0.5 rounded-full">{UI.newItem[lang]}</span>
            )}
            {item.is_vegetarian && (
              <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#16A34A] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <CiApple size={11} /> {UI.vegetarian[lang]}
              </span>
            )}
          </div>
        )}
        {(item.calories || hasAllergens) && (
          <div className="flex items-center justify-between mt-auto pt-1.5">
            {item.calories ? <span className="text-[11px] text-[#9CA3AF] font-light">{item.calories} kcal</span> : <span />}
            {hasAllergens && (
              <div className="flex items-center gap-1">
                {item.allergens!.map((a) => {
                  const config = ALLERGEN_CONFIG[a];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <span key={a} className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: config.bg }} title={config.label[lang]}>
                      <Icon size={12} style={{ color: config.color }} />
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Item Detail Modal                                                  */
/* ------------------------------------------------------------------ */

function ItemDetailModal({ item, lang, onClose }: { item: MenuItem; lang: LangCode; onClose: () => void }) {
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
        >
          <CiCircleRemove size={20} />
        </button>

        {/* Image */}
        {item.image_url ? (
          <img src={item.image_url} alt={name} className="w-full h-64 object-cover rounded-t-3xl sm:rounded-t-3xl" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-[#A8B977]/20 to-[#E4A07A]/20 flex items-center justify-center rounded-t-3xl">
            <CiForkAndKnife size={56} className="text-[#A8B977]/30" />
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Badges */}
          {(item.is_popular || item.is_new || item.is_vegetarian) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {item.is_popular && (
                <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#B45309] text-xs font-semibold px-3 py-1 rounded-full">
                  <CiStar size={14} /> {UI.popular[lang]}
                </span>
              )}
              {item.is_new && (
                <span className="inline-flex items-center gap-0.5 bg-[#DBEAFE] text-[#1D4ED8] text-xs font-semibold px-3 py-1 rounded-full">{UI.newItem[lang]}</span>
              )}
              {item.is_vegetarian && (
                <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold px-3 py-1 rounded-full">
                  <CiApple size={14} /> {UI.vegetarian[lang]}
                </span>
              )}
            </div>
          )}

          {/* Name + Price */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-xl font-bold text-[#1A1A1A] leading-tight">{name}</h2>
            <span className="text-xl font-bold text-[#A8B977] flex-shrink-0 tabular-nums">
              {Number(item.price).toFixed(2)} ₺
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-[#6B7280] font-light leading-relaxed mb-4">{description}</p>
          )}

          {/* Calories */}
          {item.calories && (
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mb-4">
              <CiTempHigh size={16} />
              <span>{item.calories} kcal</span>
            </div>
          )}

          {/* Allergens */}
          {hasAllergens && (
            <div className="border-t border-[#E8E6E0] pt-4">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{UI.allergens[lang]}</p>
              <div className="flex flex-wrap gap-2">
                {item.allergens!.map((a) => {
                  const config = ALLERGEN_CONFIG[a];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <span key={a} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                      <Icon size={14} /> {config.label[lang]}
                    </span>
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
