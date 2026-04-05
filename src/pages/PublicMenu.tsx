import { useEffect, useState } from 'react';
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
} from 'react-icons/ci';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_vegetarian: boolean;
  allergens: string[] | null;
  calories: number | null;
  sort_order: number;
}

const ALLERGEN_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  gluten: CiWheat,
  dairy: CiDroplet,
  egg: CiCircleAlert,
  nuts: CiApple,
  seafood: CiWavePulse1,
  soy: CiLemon,
  spicy: CiTempHigh,
};

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center">
        <p className="font-body text-[#6B7280] text-sm">Menü yükleniyor...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center gap-4 px-4">
        <p className="font-heading font-bold text-lg text-[#1A1A1A]">Bu menü mevcut değil</p>
        <a href="https://tabbled.com" className="text-[#A8B977] underline text-sm font-body">
          tabbled.com
        </a>
      </div>
    );
  }

  const filteredItems = activeCategory
    ? items.filter((i) => i.category_id === activeCategory)
    : items;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const groupedItems: Record<string, MenuItem[]> = {};
  if (!activeCategory) {
    for (const item of filteredItems) {
      const catName = categoryMap.get(item.category_id) ?? 'Diğer';
      if (!groupedItems[catName]) groupedItems[catName] = [];
      groupedItems[catName].push(item);
    }
  }

  const hasNoItems = filteredItems.length === 0 && !activeCategory && items.length === 0;

  return (
    <div className="min-h-screen bg-[#F5F3EE] font-body">
      {/* Header */}
      <header className="bg-[#422B21] text-white px-4 py-6">
        <div className="max-w-[480px] mx-auto flex items-center gap-4">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#A8B977] flex items-center justify-center flex-shrink-0">
              <span className="font-heading font-bold text-xl text-white">
                {restaurant.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-xl truncate">{restaurant.name}</h1>
            {restaurant.address && (
              <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                <CiMapPin size={12} />
                <span className="truncate">{restaurant.address}</span>
              </p>
            )}
            {restaurant.phone && (
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <CiPhone size={12} />
                {restaurant.phone}
              </p>
            )}
          </div>
          {table && (
            <span className="bg-[#A8B977] text-white text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">
              Masa {table}
            </span>
          )}
        </div>
      </header>

      {/* Category Tab Bar */}
      <div className="sticky top-0 z-10 bg-[#F5F3EE] border-b border-[#E8E6E0]">
        <div className="max-w-[480px] mx-auto">
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-[#A8B977] text-white'
                  : 'bg-white border border-[#E8E6E0] text-[#6B7280]'
              }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#A8B977] text-white'
                    : 'bg-white border border-[#E8E6E0] text-[#6B7280]'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 py-4 pb-20">
        {hasNoItems ? (
          <div className="text-center py-16">
            <p className="text-[#6B7280] text-sm">Menü henüz hazırlanıyor</p>
          </div>
        ) : activeCategory ? (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-center text-[#6B7280] text-sm py-8">
                Bu kategoride ürün bulunmuyor
              </p>
            )}
          </div>
        ) : (
          Object.entries(groupedItems).map(([catName, catItems]) => (
            <div key={catName} className="mb-6">
              <div className="border-t border-[#E8E6E0] pt-4 mb-3">
                <h2 className="text-xs font-bold uppercase text-[#6B7280] tracking-wider">
                  {catName}
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#F5F3EE] border-t border-[#E8E6E0] py-3">
        <p className="text-center text-[#6B7280] text-xs">
          Powered by{' '}
          <a href="https://tabbled.com" className="text-[#A8B977] font-medium">
            Tabbled
          </a>
        </p>
      </footer>
    </div>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="bg-white border border-[#E8E6E0] rounded-xl p-3 flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-[15px] text-[#1A1A1A] leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-[13px] text-[#6B7280] font-extralight mt-1 line-clamp-2 leading-snug">
              {item.description}
            </p>
          )}
        </div>
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {item.is_popular && (
              <span className="inline-flex items-center gap-0.5 bg-[#E4D085] text-[#422B21] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                <CiStar size={12} /> Popüler
              </span>
            )}
            {item.is_new && (
              <span className="inline-flex items-center gap-0.5 bg-[#fef3c7] text-[#b45309] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                <CiStar size={12} /> Yeni
              </span>
            )}
            {item.is_vegetarian && (
              <span className="inline-flex items-center gap-0.5 bg-[#dcfce7] text-[#16a34a] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                <CiApple size={12} />
              </span>
            )}
          </div>
          {item.allergens && item.allergens.length > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              {item.allergens.map((a) => {
                const Icon = ALLERGEN_ICONS[a];
                return Icon ? (
                  <span key={a} className="text-[#6B7280]" title={a}>
                    <Icon size={14} />
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[#A8B977]">₺{item.price}</span>
            {item.calories && (
              <span className="text-[11px] text-[#6B7280] flex items-center gap-0.5">
                <CiTempHigh size={12} /> {item.calories} kcal
              </span>
            )}
          </div>
        </div>
      </div>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-[#A8B977]/30 to-[#E4A07A]/30" />
      )}
    </div>
  );
}
