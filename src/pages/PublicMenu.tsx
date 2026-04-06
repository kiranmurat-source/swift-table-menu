import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  CiWheat,
  CiDroplet,
  CiCircleAlert,
  CiApple,
  CiLemon,
  CiStar,
  CiTempHigh,
  CiWavePulse1,
  CiMapPin,
  CiPhone,
  CiGlobe,
} from 'react-icons/ci';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LangCode = 'tr' | 'en' | 'ar' | 'zh';

interface Translations {
  [lang: string]: {
    name?: string;
    description?: string;
    tagline?: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  description_tr: string | null;
  tagline: string | null;
  enabled_languages: string[];
  translations: Translations;
}

interface MenuCategory {
  id: string;
  restaurant_id: string;
  name_tr: string;
  description_tr: string | null;
  sort_order: number;
  is_active: boolean;
  translations: Translations;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_tr: string;
  description_tr: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_vegetarian: boolean;
  allergens: string[] | null;
  calories: number | null;
  sort_order: number;
  translations: Translations;
}

/* ------------------------------------------------------------------ */
/*  Translation helper                                                 */
/* ------------------------------------------------------------------ */

function t(
  translations: Translations | null | undefined,
  field: string,
  fallback: string | null | undefined,
  lang: LangCode
): string {
  if (lang === 'tr') return fallback ?? '';
  const val = translations?.[lang]?.[field as keyof Translations[string]];
  if (val && typeof val === 'string' && val.trim() !== '') return val;
  return fallback ?? '';
}

/* ------------------------------------------------------------------ */
/*  Language labels                                                    */
/* ------------------------------------------------------------------ */

const LANG_LABELS: Record<LangCode, string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  zh: '中文',
};

/* ------------------------------------------------------------------ */
/*  Allergen config                                                    */
/* ------------------------------------------------------------------ */

const ALLERGEN_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: Record<LangCode, string>;
}> = {
  gluten: {
    icon: CiWheat,
    label: { tr: 'Gluten', en: 'Gluten', ar: 'غلوتين', zh: '麸质' },
  },
  dairy: {
    icon: CiDroplet,
    label: { tr: 'Süt', en: 'Dairy', ar: 'ألبان', zh: '乳制品' },
  },
  egg: {
    icon: CiCircleAlert,
    label: { tr: 'Yumurta', en: 'Egg', ar: 'بيض', zh: '鸡蛋' },
  },
  nuts: {
    icon: CiApple,
    label: { tr: 'Kuruyemiş', en: 'Nuts', ar: 'مكسرات', zh: '坚果' },
  },
  seafood: {
    icon: CiWavePulse1,
    label: { tr: 'Deniz Ürünü', en: 'Seafood', ar: 'مأكولات بحرية', zh: '海鲜' },
  },
  soy: {
    icon: CiLemon,
    label: { tr: 'Soya', en: 'Soy', ar: 'صويا', zh: '大豆' },
  },
  spicy: {
    icon: CiTempHigh,
    label: { tr: 'Acı', en: 'Spicy', ar: 'حار', zh: '辣' },
  },
};

/* ------------------------------------------------------------------ */
/*  UI Labels (i18n)                                                   */
/* ------------------------------------------------------------------ */

const UI_LABELS: Record<string, Record<LangCode, string>> = {
  all: { tr: 'Tümü', en: 'All', ar: 'الكل', zh: '全部' },
  loading: { tr: 'Menü yükleniyor...', en: 'Loading menu...', ar: 'جاري تحميل القائمة...', zh: '菜单加载中...' },
  notFound: { tr: 'Bu menü mevcut değil', en: 'This menu does not exist', ar: 'هذه القائمة غير موجودة', zh: '此菜单不存在' },
  noItems: { tr: 'Menü henüz hazırlanıyor', en: 'Menu is being prepared', ar: 'القائمة قيد الإعداد', zh: '菜单正在准备中' },
  noItemsInCat: { tr: 'Bu kategoride ürün bulunmuyor', en: 'No items in this category', ar: 'لا توجد عناصر في هذه الفئة', zh: '此类别中没有项目' },
  popular: { tr: 'Popüler', en: 'Popular', ar: 'شائع', zh: '热门' },
  newItem: { tr: 'Yeni', en: 'New', ar: 'جديد', zh: '新品' },
  vegetarian: { tr: 'Vejetaryen', en: 'Vegetarian', ar: 'نباتي', zh: '素食' },
  table: { tr: 'Masa', en: 'Table', ar: 'طاولة', zh: '桌号' },
  other: { tr: 'Diğer', en: 'Other', ar: 'أخرى', zh: '其他' },
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

  // Determine active language
  const lang: LangCode = useMemo(() => {
    if (langParam === 'tr') return 'tr';
    if (!restaurant) return 'tr';
    const enabled = restaurant.enabled_languages ?? [];
    return enabled.includes(langParam) ? langParam : 'tr';
  }, [langParam, restaurant]);

  // Available languages for this restaurant
  const availableLanguages: LangCode[] = useMemo(() => {
    if (!restaurant) return ['tr'];
    const enabled = (restaurant.enabled_languages ?? []) as LangCode[];
    return ['tr', ...enabled.filter((l) => l !== 'tr')];
  }, [restaurant]);

  const setLang = (newLang: LangCode) => {
    const params = new URLSearchParams(searchParams);
    if (newLang === 'tr') {
      params.delete('lang');
    } else {
      params.set('lang', newLang);
    }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!rest) {
        setLoading(false);
        return;
      }

      setRestaurant(rest);

      const [{ data: cats }, { data: menuItems }] = await Promise.all([
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
      ]);

      setCategories(cats ?? []);
      setItems(menuItems ?? []);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#A8B977] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm tracking-wide">{UI_LABELS.loading[lang]}</p>
        </div>
      </div>
    );
  }

  /* ---- Not found ---- */
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-bold text-lg text-[#1A1A1A]">{UI_LABELS.notFound[lang]}</p>
        <a href="https://tabbled.com" className="text-[#A8B977] underline text-sm">
          tabbled.com
        </a>
      </div>
    );
  }

  /* ---- Filter & group items ---- */
  const filteredItems = activeCategory
    ? items.filter((i) => i.category_id === activeCategory)
    : items;

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

    // Sort groups by category sort_order
    const sortedKeys = [...groups.keys()].sort(
      (a, b) => (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999)
    );

    for (const key of sortedKeys) {
      groupedItems.push({
        category: categoryMap.get(key) ?? null,
        items: groups.get(key)!,
      });
    }
  }

  const hasNoItems = filteredItems.length === 0 && !activeCategory && items.length === 0;
  const coverImage = restaurant.cover_image_url || restaurant.cover_url;

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-40 bg-[#422B21]">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#422B21] to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className={`bg-[#422B21] text-white px-4 ${coverImage ? '-mt-16 relative z-10 pt-2 pb-5' : 'py-6'}`}>
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-center gap-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-white/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#A8B977] flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                <span className="font-bold text-xl text-white">
                  {restaurant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-xl truncate">{restaurant.name}</h1>
              {restaurant.tagline && (
                <p className="text-white/50 text-xs mt-0.5 font-light truncate">
                  {t(restaurant.translations, 'tagline', restaurant.tagline, lang)}
                </p>
              )}
              {restaurant.address && (
                <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                  <CiMapPin size={12} className="flex-shrink-0" />
                  <span className="truncate">{restaurant.address}</span>
                </p>
              )}
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="text-white/60 text-xs flex items-center gap-1 mt-0.5 hover:text-white/80 transition-colors"
                >
                  <CiPhone size={12} className="flex-shrink-0" />
                  {restaurant.phone}
                </a>
              )}
            </div>
            {table && (
              <span className="bg-[#A8B977] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
                {UI_LABELS.table[lang]} {table}
              </span>
            )}
          </div>

          {/* Language Switcher */}
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <CiGlobe size={14} className="text-white/40" />
              <div className="flex gap-1">
                {availableLanguages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      lang === l
                        ? 'bg-[#A8B977] text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
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
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-[#422B21] text-white shadow-sm'
                  : 'bg-white border border-[#E8E6E0] text-[#6B7280] hover:border-[#422B21]/30'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              {UI_LABELS.all[lang]}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#422B21] text-white shadow-sm'
                    : 'bg-white border border-[#E8E6E0] text-[#6B7280] hover:border-[#422B21]/30'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
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
            <p className="text-[#9CA3AF] text-sm">{UI_LABELS.noItems[lang]}</p>
          </div>
        ) : activeCategory ? (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} lang={lang} />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-center text-[#9CA3AF] text-sm py-8">
                {UI_LABELS.noItemsInCat[lang]}
              </p>
            )}
          </div>
        ) : (
          groupedItems.map(({ category, items: catItems }) => (
            <div key={category?.id ?? 'other'} className="mb-6">
              <div className="flex items-center gap-3 mb-3 pt-2">
                <h2 className="text-sm font-bold text-[#422B21] tracking-wide uppercase">
                  {category
                    ? t(category.translations, 'name', category.name_tr, lang)
                    : UI_LABELS.other[lang]}
                </h2>
                <div className="flex-1 h-px bg-[#E8E6E0]" />
                <span className="text-xs text-[#9CA3AF]">{catItems.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} lang={lang} />
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
          <a href="https://tabbled.com" className="text-[#A8B977] font-medium hover:underline">
            Tabbled
          </a>
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Menu Item Card                                                     */
/* ------------------------------------------------------------------ */

function MenuItemCard({ item, lang }: { item: MenuItem; lang: LangCode }) {
  const name = t(item.translations, 'name', item.name_tr, lang);
  const description = t(item.translations, 'description', item.description_tr, lang);
  const hasBadges = item.is_popular || item.is_new || item.is_vegetarian;
  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <div className="bg-white border border-[#E8E6E0] rounded-2xl p-3.5 flex gap-3.5 hover:shadow-sm transition-shadow">
      {/* Image */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={name}
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#A8B977]/20 to-[#E4A07A]/20 flex items-center justify-center">
          <span className="text-2xl text-[#A8B977]/40 font-bold">{name.charAt(0)}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Name */}
        <h3 className="font-semibold text-[15px] text-[#1A1A1A] leading-tight">{name}</h3>

        {/* Description */}
        {description && (
          <p className="text-[13px] text-[#9CA3AF] font-light mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Badges */}
        {hasBadges && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {item.is_popular && (
              <span className="inline-flex items-center gap-0.5 bg-[#FEF3C7] text-[#B45309] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <CiStar size={10} /> {UI_LABELS.popular[lang]}
              </span>
            )}
            {item.is_new && (
              <span className="inline-flex items-center gap-0.5 bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {UI_LABELS.newItem[lang]}
              </span>
            )}
            {item.is_vegetarian && (
              <span className="inline-flex items-center gap-0.5 bg-[#DCFCE7] text-[#16A34A] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <CiApple size={10} /> {UI_LABELS.vegetarian[lang]}
              </span>
            )}
          </div>
        )}

        {/* Bottom row: Price + Calories + Allergens */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#A8B977]">
              ₺{Number(item.price).toFixed(2)}
            </span>
            {item.calories && (
              <span className="text-[11px] text-[#9CA3AF] font-light">
                {item.calories} kcal
              </span>
            )}
          </div>

          {/* Allergens */}
          {hasAllergens && (
            <div className="flex items-center gap-1">
              {item.allergens!.map((a) => {
                const config = ALLERGEN_CONFIG[a];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <span
                    key={a}
                    className="w-5 h-5 rounded-full bg-[#FEF2F2] flex items-center justify-center"
                    title={config.label[lang]}
                  >
                    <Icon size={12} className="text-[#DC2626]" />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
