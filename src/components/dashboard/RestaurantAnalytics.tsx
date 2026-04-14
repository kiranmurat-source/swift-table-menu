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
import type { AdminTheme } from '../../lib/adminTheme';
import { getAdminTheme } from '../../lib/adminTheme';

/* ---------------------------------- types --------------------------------- */

interface Props {
  restaurantId: string;
  featureWaiterCalls: boolean;
  featureFeedback: boolean;
  featureLikes: boolean;
  featureDiscountCodes: boolean;
  featureReviews: boolean;
  onNavigate?: (tab: string) => void;
  theme?: AdminTheme;
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

interface PendingReviewRow {
  id: string;
  rating: number;
  comment: string;
  customer_name: string | null;
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
  pendingReviews: PendingReviewRow[];
}

/* --------------------------------- styles --------------------------------- */

function makeStyles(t: AdminTheme) {
  return {
    card: {
      background: t.cardBg,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 12,
      padding: 20,
      boxShadow: t.cardShadow,
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: t.heading,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 14,
      fontFamily: "'Roboto', sans-serif",
    } as React.CSSProperties,
    bigNumber: {
      fontSize: 28,
      fontWeight: 800,
      color: t.value,
      lineHeight: 1,
      fontFamily: "'Roboto', sans-serif",
      letterSpacing: '-0.02em',
    } as React.CSSProperties,
    subText: {
      fontSize: 12,
      color: t.heading,
      marginTop: 6,
      fontFamily: "'Roboto', sans-serif",
    } as React.CSSProperties,
    emptyState: {
      fontSize: 13,
      color: t.subtle,
      textAlign: 'center',
      padding: '24px 0',
      fontFamily: "'Roboto', sans-serif",
    } as React.CSSProperties,
    divider: `1px solid ${t.divider}`,
  };
}
type StyleMap = ReturnType<typeof makeStyles>;

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

function SkeletonBlock({ height = 120, t, s }: { height?: number; t: AdminTheme; s: StyleMap }) {
  const isDark = t.key === 'dark';
  const shimmerA = isDark ? '#1F2229' : '#F3F3F1';
  const shimmerB = isDark ? '#2A2D36' : '#FAFAF8';
  return (
    <div
      style={{
        ...s.card,
        height,
        background: `linear-gradient(90deg, ${shimmerA} 0%, ${shimmerB} 50%, ${shimmerA} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'dash-shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

/* ------------------------------ summary cards ----------------------------- */

function SummaryCards({ data, t, s }: { data: AllData; t: AdminTheme; s: StyleMap }) {
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
      icon: <ForkKnife size={20} color={t.icon} weight="thin" />,
    },
    {
      title: 'Aktif Ürün',
      value: String(active),
      sub: soldOut > 0 ? `${soldOut} tükendi` : 'Tükenen yok',
      icon: <CheckCircle size={20} color={t.icon} weight="thin" />,
    },
    {
      title: 'Geri Bildirim',
      value: data.avgRating !== null ? `★ ${data.avgRating.toFixed(1)}` : '—',
      sub: data.allFeedbackCount > 0 ? `${data.allFeedbackCount} değerlendirme` : 'Henüz değerlendirme yok',
      icon: <Star size={20} color={t.icon} weight="thin" />,
    },
    {
      title: 'Toplam Beğeni',
      value: String(data.totalLikeCount),
      sub: data.weeklyLikeCount > 0 ? `bu hafta +${data.weeklyLikeCount}` : 'bu hafta 0',
      icon: <Heart size={20} color={t.icon} weight="thin" />,
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
        <div key={it.title} style={s.card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={s.sectionTitle}>{it.title}</span>
            {it.icon}
          </div>
          <div style={s.bigNumber}>{it.value}</div>
          <div style={s.subText}>{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- waiter calls bar chart ------------------------ */

function WaiterCallsChart({ calls, t, s }: { calls: WaiterCallRow[]; t: AdminTheme; s: StyleMap }) {
  const buckets = buildLast7Days(calls);
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const avg = total / 7;

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Bell size={16} color={t.heading} weight="thin" />
        <span style={s.sectionTitle}>Garson Çağrıları (Son 7 Gün)</span>
      </div>

      {total === 0 ? (
        <div style={s.emptyState}>Son 7 günde garson çağrısı yok</div>
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
                <span style={{ fontSize: 11, color: t.heading, fontWeight: 600 }}>{b.count}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(b.count / max) * 100}%`,
                    minHeight: b.count > 0 ? 4 : 0,
                    background: b.count > 0 ? t.chartBar : t.chartGrid,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    transition: 'height 0.2s',
                  }}
                />
                <span style={{ fontSize: 11, color: t.chartLabel }}>{b.dayLabel}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: t.heading }}>
            Toplam: <strong style={{ color: t.value }}>{total}</strong> çağrı · Ort:{' '}
            <strong style={{ color: t.value }}>{avg.toFixed(1)}</strong>/gün
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ popular items ----------------------------- */

function PopularItems({ items, likes, t, s }: { items: MenuItemRow[]; likes: LikeRow[]; t: AdminTheme; s: StyleMap }) {
  const countMap = new Map<string, number>();
  for (const l of likes) countMap.set(l.menu_item_id, (countMap.get(l.menu_item_id) || 0) + 1);
  const itemMap = new Map(items.map((i) => [i.id, i.name_tr]));
  const top5 = Array.from(countMap.entries())
    .map(([id, count]) => ({ id, name: itemMap.get(id) || 'Bilinmeyen ürün', count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Heart size={16} color={t.accent} weight="fill" />
        <span style={s.sectionTitle}>En Çok Beğenilen Ürünler</span>
      </div>
      {top5.length === 0 ? (
        <div style={s.emptyState}>Henüz beğeni yok</div>
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
                borderBottom: idx < top5.length - 1 ? s.divider : 'none',
              }}
            >
              <span
                style={{
                  width: 22,
                  fontSize: 13,
                  color: idx === 0 ? t.accent : t.subtle,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {idx + 1}.
              </span>
              {idx === 0 && <Fire size={16} color={t.accent} weight="fill" />}
              <span style={{ flex: 1, fontSize: 14, color: t.value, fontWeight: idx === 0 ? 600 : 500 }}>
                {row.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: t.heading }}>
                <Heart size={14} color={t.accent} weight="fill" />
                <strong style={{ color: t.value }}>{row.count}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------- recent feedback ---------------------------- */

function RecentFeedback({ feedback, onSeeAll, t, s }: { feedback: FeedbackRow[]; onSeeAll?: () => void; t: AdminTheme; s: StyleMap }) {
  const rows = feedback.slice(0, 5);

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChatCircle size={16} color={t.heading} weight="thin" />
        <span style={s.sectionTitle}>Son Geri Bildirimler</span>
      </div>
      {rows.length === 0 ? (
        <div style={s.emptyState}>Henüz geri bildirim yok</div>
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
                    borderBottom: idx < rows.length - 1 ? s.divider : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={13}
                        color={n <= f.rating ? t.accent : t.cardBorder}
                        weight={n <= f.rating ? 'fill' : 'regular'}
                      />
                    ))}
                    {truncated && (
                      <span style={{ marginLeft: 8, fontSize: 13, color: t.value, fontStyle: 'italic' }}>
                        "{truncated}"
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: t.subtle }}>
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
                color: t.accent,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'Roboto', sans-serif",
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

/* ----------------------------- pending reviews --------------------------- */

function PendingReviews({ reviews, onSeeAll, t, s }: { reviews: PendingReviewRow[]; onSeeAll?: () => void; t: AdminTheme; s: StyleMap }) {
  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Star size={16} color={t.accent} weight="fill" />
        <span style={s.sectionTitle}>Bekleyen Yorumlar</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 700,
            color: t.warning,
            backgroundColor: `${t.warning}22`,
            padding: '3px 10px',
            borderRadius: 999,
          }}
        >
          {reviews.length}
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {reviews.map((r, idx) => {
          const truncated = r.comment.length > 50 ? `${r.comment.slice(0, 50)}…` : r.comment;
          return (
            <li
              key={r.id}
              style={{
                padding: '12px 0',
                borderBottom: idx < reviews.length - 1 ? s.divider : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={13}
                    color={n <= r.rating ? t.accent : t.cardBorder}
                    weight={n <= r.rating ? 'fill' : 'regular'}
                  />
                ))}
                <span style={{ marginLeft: 8, fontSize: 13, color: t.value, fontStyle: 'italic' }}>
                  "{truncated}"
                </span>
              </div>
              <div style={{ fontSize: 11, color: t.subtle }}>
                {r.customer_name || 'Misafir'} · {timeAgo(r.created_at)}
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
            color: t.accent,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          Tümünü Gör →
        </button>
      )}
    </div>
  );
}

/* --------------------------- discount codes status ------------------------ */

function DiscountCodesStatus({ codes, onSeeAll, t, s }: { codes: DiscountCodeRow[]; onSeeAll?: () => void; t: AdminTheme; s: StyleMap }) {
  const now = Date.now();
  const active = codes
    .filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > now))
    .sort((a, b) => b.current_uses - a.current_uses)
    .slice(0, 5);

  return (
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Percent size={16} color={t.heading} weight="thin" />
        <span style={s.sectionTitle}>Aktif İndirim Kodları</span>
      </div>
      {active.length === 0 ? (
        <div style={s.emptyState}>Aktif indirim kodu yok</div>
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
                    borderBottom: idx < active.length - 1 ? s.divider : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: t.value,
                      minWidth: 100,
                    }}
                  >
                    {c.code}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: t.accent,
                      fontWeight: 600,
                      background: t.heatmapLow,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {valueLabel}
                  </span>
                  <span style={{ flex: 1, fontSize: 12, color: t.heading, textAlign: 'right' }}>
                    {usage} kullanım
                  </span>
                  {warn && <WarningCircle size={16} color={t.warning} weight="fill" />}
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
                color: t.accent,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'Roboto', sans-serif",
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

function MenuSummary({ items, categories, t, s }: { items: MenuItemRow[]; categories: CategoryRow[]; t: AdminTheme; s: StyleMap }) {
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
    <div style={s.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChartBar size={16} color={t.heading} weight="thin" />
        <span style={s.sectionTitle}>Menü Özeti</span>
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
              borderBottom: idx < rows.length - 1 ? s.divider : 'none',
              fontSize: 13,
            }}
          >
            <span style={{ color: t.heading }}>{r.label}</span>
            <span
              style={{
                color: r.warn ? t.warning : t.value,
                fontWeight: 600,
                background: r.warn ? `${t.warning}22` : 'transparent',
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
  featureReviews,
  onNavigate,
  theme,
}: Props) {
  const t = theme ?? getAdminTheme('light');
  const s = makeStyles(t);
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
        pendingReviewsRes,
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
        featureReviews
          ? supabase
              .from('reviews')
              .select('id, rating, comment, customer_name, created_at')
              .eq('restaurant_id', restaurantId)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [] as PendingReviewRow[] }),
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
        pendingReviews: (pendingReviewsRes.data ?? []) as PendingReviewRow[],
      });
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, featureWaiterCalls, featureFeedback, featureLikes, featureDiscountCodes, featureReviews]);

  return (
    <div style={{ padding: '4px 0 32px', fontFamily: "'Roboto', sans-serif" }}>
      <style>{`
        @keyframes dash-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.value, margin: 0, letterSpacing: '-0.01em' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: t.heading, marginTop: 4 }}>İşletmenizin genel durumu</p>
      </div>

      {loading || !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <SkeletonBlock t={t} s={s} />
            <SkeletonBlock t={t} s={s} />
            <SkeletonBlock t={t} s={s} />
            <SkeletonBlock t={t} s={s} />
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <SkeletonBlock height={220} t={t} s={s} />
            <SkeletonBlock height={220} t={t} s={s} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SummaryCards data={data} t={t} s={s} />

          {(featureWaiterCalls || featureLikes) && (
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              }}
            >
              {featureWaiterCalls && <WaiterCallsChart calls={data.waiterCalls} t={t} s={s} />}
              {featureLikes && <PopularItems items={data.items} likes={data.likes} t={t} s={s} />}
            </div>
          )}

          {featureFeedback && (
            <RecentFeedback feedback={data.feedback} onSeeAll={onNavigate ? () => onNavigate('feedback') : undefined} t={t} s={s} />
          )}

          {featureReviews && data.pendingReviews.length > 0 && (
            <PendingReviews
              reviews={data.pendingReviews}
              onSeeAll={onNavigate ? () => onNavigate('reviews') : undefined}
              t={t} s={s}
            />
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
                t={t} s={s}
              />
            )}
            <MenuSummary items={data.items} categories={data.categories} t={t} s={s} />
          </div>
        </div>
      )}
    </div>
  );
}
