import { useEffect, useState } from 'react';
import {
  ForkKnife,
  CheckCircle,
  Star,
  Heart,
  Bell,
  Fire,
  ChatCircle,
  Percent,
  WarningCircle,
  ChartBar,
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase';

/* ---------------------------------- types --------------------------------- */

interface Props {
  restaurantId: string;
  featureWaiterCalls: boolean;
  featureFeedback: boolean;
  featureLikes: boolean;
  featureDiscountCodes: boolean;
  onNavigate?: (tab: string) => void;
}

interface MenuItemRow {
  id: string;
  name_tr: string;
  is_available: boolean;
  is_sold_out: boolean;
  is_featured: boolean;
  image_url: string | null;
  allergens: string[] | null;
  category_id: string;
}

interface CategoryRow {
  id: string;
  parent_id: string | null;
}

interface WaiterCallRow {
  id: string;
  created_at: string;
}

interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  table_number: string | null;
  created_at: string;
}

interface LikeRow {
  id: string;
  menu_item_id: string;
  status: string;
  created_at: string;
}

interface DiscountCodeRow {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
}

interface AllData {
  items: MenuItemRow[];
  categories: CategoryRow[];
  waiterCalls: WaiterCallRow[];
  feedback: FeedbackRow[];
  discountCodes: DiscountCodeRow[];
  likes: LikeRow[];
  allFeedbackCount: number;
  avgRating: number | null;
  totalLikeCount: number;
  weeklyLikeCount: number;
}

/* --------------------------------- styles --------------------------------- */

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E5E3',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6B6B6F',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 14,
  fontFamily: "'Inter', sans-serif",
};

const bigNumber: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#1C1C1E',
  lineHeight: 1,
  fontFamily: "'Inter', sans-serif",
  letterSpacing: '-0.02em',
};

const subText: React.CSSProperties = {
  fontSize: 12,
  color: '#6B6B6F',
  marginTop: 6,
  fontFamily: "'Inter', sans-serif",
};

const emptyState: React.CSSProperties = {
  fontSize: 13,
  color: '#9CA3AF',
  textAlign: 'center',
  padding: '24px 0',
  fontFamily: "'Inter', sans-serif",
};

/* --------------------------------- helpers -------------------------------- */

const DAY_LABELS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;
  if (diffDay < 7) return `${diffDay} gün önce`;
  return d.toLocaleDateString('tr-TR');
}

function buildLast7Days(calls: WaiterCallRow[]): { dayLabel: string; count: number; date: string }[] {
  const buckets: { dayLabel: string; count: number; date: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({
      date: d.toISOString().slice(0, 10),
      dayLabel: DAY_LABELS_TR[d.getDay()],
      count: 0,
    });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  for (const c of calls) {
    const key = new Date(c.created_at).toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/* --------------------------------- loading -------------------------------- */

function SkeletonBlock({ height = 120 }: { height?: number }) {
  return (
    <div
      style={{
        ...card,
        height,
        background: 'linear-gradient(90deg, #F3F3F1 0%, #FAFAF8 50%, #F3F3F1 100%)',
        backgroundSize: '200% 100%',
        animation: 'dash-shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

/* ------------------------------ summary cards ----------------------------- */

function SummaryCards({ data }: { data: AllData }) {
  const total = data.items.length;
  const inactive = data.items.filter((i) => !i.is_available).length;
  const active = data.items.filter((i) => i.is_available && !i.is_sold_out).length;
  const soldOut = data.items.filter((i) => i.is_sold_out).length;

  const items: Array<{
    title: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
  }> = [
    {
      title: 'Toplam Ürün',
      value: String(total),
      sub: inactive > 0 ? `${inactive} pasif` : 'Tümü aktif',
      icon: <ForkKnife size={20} color="#9CA3AF" />,
    },
    {
      title: 'Aktif Ürün',
      value: String(active),
      sub: soldOut > 0 ? `${soldOut} tükendi` : 'Tükenen yok',
      icon: <CheckCircle size={20} color="#9CA3AF" />,
    },
    {
      title: 'Geri Bildirim',
      value: data.avgRating !== null ? `★ ${data.avgRating.toFixed(1)}` : '—',
      sub: data.allFeedbackCount > 0 ? `${data.allFeedbackCount} değerlendirme` : 'Henüz değerlendirme yok',
      icon: <Star size={20} color="#9CA3AF" />,
    },
    {
      title: 'Toplam Beğeni',
      value: String(data.totalLikeCount),
      sub: data.weeklyLikeCount > 0 ? `bu hafta +${data.weeklyLikeCount}` : 'bu hafta 0',
      icon: <Heart size={20} color="#9CA3AF" />,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      }}
    >
      {items.map((it) => (
        <div key={it.title} style={card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={sectionTitle}>{it.title}</span>
            {it.icon}
          </div>
          <div style={bigNumber}>{it.value}</div>
          <div style={subText}>{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- waiter calls bar chart ------------------------ */

function WaiterCallsChart({ calls }: { calls: WaiterCallRow[] }) {
  const buckets = buildLast7Days(calls);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const avg = total / 7;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Bell size={16} color="#6B6B6F" />
        <span style={sectionTitle}>Garson Çağrıları (Son 7 Gün)</span>
      </div>

      {total === 0 ? (
        <div style={emptyState}>Son 7 günde garson çağrısı yok</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '8px 0' }}>
            {buckets.map((b) => (
              <div
                key={b.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: 11, color: '#6B6B6F', fontWeight: 600 }}>{b.count}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(b.count / max) * 100}%`,
                    minHeight: b.count > 0 ? 4 : 0,
                    background: b.count > 0 ? '#FF4F7A' : '#F3F3F1',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    transition: 'height 0.2s',
                  }}
                />
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{b.dayLabel}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#6B6B6F' }}>
            Toplam: <strong style={{ color: '#1C1C1E' }}>{total}</strong> çağrı · Ort:{' '}
            <strong style={{ color: '#1C1C1E' }}>{avg.toFixed(1)}</strong>/gün
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ popular items ----------------------------- */

function PopularItems({ items, likes }: { items: MenuItemRow[]; likes: LikeRow[] }) {
  // likes are pre-filtered at the DB level (status=approved, last 90 days)
  const countMap = new Map<string, number>();
  for (const l of likes) countMap.set(l.menu_item_id, (countMap.get(l.menu_item_id) || 0) + 1);
  const itemMap = new Map(items.map((i) => [i.id, i.name_tr]));
  const top5 = Array.from(countMap.entries())
    .map(([id, count]) => ({ id, name: itemMap.get(id) || 'Bilinmeyen ürün', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Heart size={16} color="#6B6B6F" weight="fill" />
        <span style={sectionTitle}>En Çok Beğenilen Ürünler</span>
      </div>
      {top5.length === 0 ? (
        <div style={emptyState}>Henüz beğeni yok</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {top5.map((row, idx) => (
            <li
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: idx < top5.length - 1 ? '1px solid #F0F0EC' : 'none',
              }}
            >
              <span
                style={{
                  width: 22,
                  fontSize: 13,
                  color: idx === 0 ? '#FF4F7A' : '#9CA3AF',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {idx + 1}.
              </span>
              {idx === 0 && <Fire size={16} color="#FF4F7A" weight="fill" />}
              <span style={{ flex: 1, fontSize: 14, color: '#1C1C1E', fontWeight: idx === 0 ? 600 : 500 }}>
                {row.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B6B6F' }}>
                <Heart size={14} color="#FF4F7A" weight="fill" />
                <strong style={{ color: '#1C1C1E' }}>{row.count}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------- recent feedback ---------------------------- */

function RecentFeedback({ feedback, onSeeAll }: { feedback: FeedbackRow[]; onSeeAll?: () => void }) {
  const rows = feedback.slice(0, 5);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChatCircle size={16} color="#6B6B6F" />
        <span style={sectionTitle}>Son Geri Bildirimler</span>
      </div>
      {rows.length === 0 ? (
        <div style={emptyState}>Henüz geri bildirim yok</div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {rows.map((f, idx) => {
              const truncated = f.comment && f.comment.length > 80 ? `${f.comment.slice(0, 80)}…` : f.comment;
              return (
                <li
                  key={f.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: idx < rows.length - 1 ? '1px solid #F0F0EC' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={13}
                        color={n <= f.rating ? '#FF4F7A' : '#E5E5E3'}
                        weight={n <= f.rating ? 'fill' : 'regular'}
                      />
                    ))}
                    {truncated && (
                      <span style={{ marginLeft: 8, fontSize: 13, color: '#1C1C1E', fontStyle: 'italic' }}>
                        "{truncated}"
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {f.customer_name || 'Anonim'} · {timeAgo(f.created_at)}
                    {f.table_number ? ` · Masa ${f.table_number}` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: '#FF4F7A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Tümünü Gör →
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* --------------------------- discount codes status ------------------------ */

function DiscountCodesStatus({ codes, onSeeAll }: { codes: DiscountCodeRow[]; onSeeAll?: () => void }) {
  const now = Date.now();
  const active = codes
    .filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > now))
    .sort((a, b) => b.current_uses - a.current_uses)
    .slice(0, 5);

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Percent size={16} color="#6B6B6F" />
        <span style={sectionTitle}>Aktif İndirim Kodları</span>
      </div>
      {active.length === 0 ? (
        <div style={emptyState}>Aktif indirim kodu yok</div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {active.map((c, idx) => {
              const usage = c.max_uses ? `${c.current_uses}/${c.max_uses}` : `${c.current_uses}/∞`;
              const warn = c.max_uses ? c.current_uses / c.max_uses >= 0.8 : false;
              const valueLabel =
                c.discount_type === 'percentage' ? `%${c.discount_value}` : `${c.discount_value} TL`;
              return (
                <li
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: idx < active.length - 1 ? '1px solid #F0F0EC' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1C1C1E',
                      minWidth: 100,
                    }}
                  >
                    {c.code}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#FF4F7A',
                      fontWeight: 600,
                      background: '#FFF0F3',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {valueLabel}
                  </span>
                  <span style={{ flex: 1, fontSize: 12, color: '#6B6B6F', textAlign: 'right' }}>
                    {usage} kullanım
                  </span>
                  {warn && <WarningCircle size={16} color="#F59E0B" weight="fill" />}
                </li>
              );
            })}
          </ul>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              style={{
                marginTop: 12,
                background: 'none',
                border: 'none',
                color: '#FF4F7A',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Tümünü Gör →
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------- menu summary ---------------------------- */

function MenuSummary({ items, categories }: { items: MenuItemRow[]; categories: CategoryRow[] }) {
  const total = items.length || 1;
  const parentCats = categories.filter((c) => !c.parent_id).length;
  const subCats = categories.filter((c) => !!c.parent_id).length;
  const withPhoto = items.filter((i) => !!i.image_url).length;
  const withAllergens = items.filter((i) => Array.isArray(i.allergens) && i.allergens.length > 0).length;
  const soldOut = items.filter((i) => i.is_sold_out).length;
  const featured = items.filter((i) => i.is_featured).length;

  const photoPct = Math.round((withPhoto / total) * 100);
  const allergenPct = Math.round((withAllergens / total) * 100);

  const rows: Array<{ label: string; value: string; warn?: boolean }> = [
    { label: 'Kategoriler', value: String(parentCats) },
    { label: 'Alt kategoriler', value: String(subCats) },
    {
      label: 'Fotoğraflı ürün',
      value: `${withPhoto}/${items.length} (%${photoPct})`,
      warn: items.length > 0 && photoPct < 50,
    },
    {
      label: 'Alerjen bilgili',
      value: `${withAllergens}/${items.length} (%${allergenPct})`,
      warn: items.length > 0 && allergenPct < 50,
    },
    { label: 'Tükendi', value: String(soldOut) },
    { label: 'Öne çıkan', value: String(featured) },
  ];

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChartBar size={16} color="#6B6B6F" />
        <span style={sectionTitle}>Menü Özeti</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map((r, idx) => (
          <li
            key={r.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: idx < rows.length - 1 ? '1px solid #F0F0EC' : 'none',
              fontSize: 13,
            }}
          >
            <span style={{ color: '#6B6B6F' }}>{r.label}</span>
            <span
              style={{
                color: r.warn ? '#D97706' : '#1C1C1E',
                fontWeight: 600,
                background: r.warn ? '#FEF3C7' : 'transparent',
                padding: r.warn ? '2px 8px' : 0,
                borderRadius: 4,
              }}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- root ----------------------------------- */

export default function RestaurantAnalytics({
  restaurantId,
  featureWaiterCalls,
  featureFeedback,
  featureLikes,
  featureDiscountCodes,
  onNavigate,
}: Props) {
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

      const [
        itemsRes,
        catsRes,
        callsRes,
        fbRes,
        dcRes,
        likesRes,
        ratingsRes,
        weeklyLikesRes,
        totalLikesRes,
      ] = await Promise.all([
        supabase
          .from('menu_items')
          .select('id, name_tr, is_available, is_sold_out, is_featured, image_url, allergens, category_id')
          .eq('restaurant_id', restaurantId),
        supabase.from('menu_categories').select('id, parent_id').eq('restaurant_id', restaurantId),
        featureWaiterCalls
          ? supabase
              .from('waiter_calls')
              .select('id, created_at')
              .eq('restaurant_id', restaurantId)
              .gte('created_at', sevenDaysAgo)
          : Promise.resolve({ data: [] as WaiterCallRow[] }),
        featureFeedback
          ? supabase
              .from('feedback')
              .select('id, rating, comment, customer_name, table_number, created_at')
              .eq('restaurant_id', restaurantId)
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] as FeedbackRow[] }),
        featureDiscountCodes
          ? supabase.from('discount_codes').select('*').eq('restaurant_id', restaurantId).eq('is_active', true)
          : Promise.resolve({ data: [] as DiscountCodeRow[] }),
        featureLikes
          ? supabase
              .from('product_likes')
              .select('id, menu_item_id, status, created_at')
              .eq('restaurant_id', restaurantId)
              .eq('status', 'approved')
              .gte('created_at', ninetyDaysAgo)
          : Promise.resolve({ data: [] as LikeRow[] }),
        featureFeedback
          ? supabase.from('feedback').select('rating').eq('restaurant_id', restaurantId)
          : Promise.resolve({ data: [] as Array<{ rating: number }> }),
        featureLikes
          ? supabase
              .from('product_likes')
              .select('id', { count: 'exact', head: true })
              .eq('restaurant_id', restaurantId)
              .eq('status', 'approved')
              .gte('created_at', sevenDaysAgo)
          : Promise.resolve({ count: 0 }),
        featureLikes
          ? supabase
              .from('product_likes')
              .select('id', { count: 'exact', head: true })
              .eq('restaurant_id', restaurantId)
              .eq('status', 'approved')
          : Promise.resolve({ count: 0 }),
      ]);

      if (cancelled) return;

      const ratings = ((ratingsRes as { data: Array<{ rating: number }> | null }).data ?? [])
        .map((r) => r.rating)
        .filter((r) => typeof r === 'number');
      const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

      setData({
        items: (itemsRes.data ?? []) as MenuItemRow[],
        categories: (catsRes.data ?? []) as CategoryRow[],
        waiterCalls: (callsRes.data ?? []) as WaiterCallRow[],
        feedback: (fbRes.data ?? []) as FeedbackRow[],
        discountCodes: (dcRes.data ?? []) as DiscountCodeRow[],
        likes: (likesRes.data ?? []) as LikeRow[],
        allFeedbackCount: ratings.length,
        avgRating,
        totalLikeCount: (totalLikesRes as { count?: number }).count ?? 0,
        weeklyLikeCount: (weeklyLikesRes as { count?: number }).count ?? 0,
      });
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, featureWaiterCalls, featureFeedback, featureLikes, featureDiscountCodes]);

  return (
    <div style={{ padding: '4px 0 32px', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes dash-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0, letterSpacing: '-0.01em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B6F', marginTop: 4 }}>İşletmenizin genel durumu</p>
      </div>

      {loading || !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
            <SkeletonBlock />
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <SkeletonBlock height={220} />
            <SkeletonBlock height={220} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SummaryCards data={data} />

          {(featureWaiterCalls || featureLikes) && (
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              }}
            >
              {featureWaiterCalls && <WaiterCallsChart calls={data.waiterCalls} />}
              {featureLikes && <PopularItems items={data.items} likes={data.likes} />}
            </div>
          )}

          {featureFeedback && (
            <RecentFeedback feedback={data.feedback} onSeeAll={onNavigate ? () => onNavigate('feedback') : undefined} />
          )}

          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            }}
          >
            {featureDiscountCodes && (
              <DiscountCodesStatus
                codes={data.discountCodes}
                onSeeAll={onNavigate ? () => onNavigate('discounts') : undefined}
              />
            )}
            <MenuSummary items={data.items} categories={data.categories} />
          </div>
        </div>
      )}
    </div>
  );
}
