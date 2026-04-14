import { useEffect, useMemo, useState } from 'react';
import {
  Eye, CursorClick, Clock, CalendarBlank, ChartBar, TrendUp, TrendDown,
} from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import type { AdminTheme } from '../lib/adminTheme';
import { getAdminTheme } from '../lib/adminTheme';

type DayCount = { view_date: string; view_count: number };
type HourCount = { hour_of_day: number; view_count: number };
type ItemDuration = { menu_item_id: string; avg_duration: number; view_count: number };
type Item = { id: string; name_tr: string; category_id: string };
type Category = { id: string; name_tr: string };

function cardStyle(t: AdminTheme): React.CSSProperties {
  return {
    background: t.cardBg,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 12,
    padding: 16,
    boxShadow: t.cardShadow,
  };
}

const PINK = '#FF4F7A';
const BLUE = '#4F7AFF';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function AnalyticsPanel({ restaurantId, theme }: { restaurantId: string; theme?: AdminTheme }) {
  const t = theme ?? getAdminTheme('light');
  const card = cardStyle(t);
  const [range, setRange] = useState<7 | 30>(30);
  const [loading, setLoading] = useState(true);
  const [pageDaily, setPageDaily] = useState<DayCount[]>([]);
  const [itemDaily, setItemDaily] = useState<DayCount[]>([]);
  const [hourly, setHourly] = useState<HourCount[]>([]);
  const [itemDurations, setItemDurations] = useState<ItemDuration[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPage, setTotalPage] = useState(0);
  const [totalItem, setTotalItem] = useState(0);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, range]);

  async function load() {
    setLoading(true);
    const sinceIso = new Date(Date.now() - range * 86400000).toISOString();

    const [pvDaily, ivRows, hourlyRes, durRes, itemsRes, catsRes, totalPv] = await Promise.all([
      supabase.rpc('get_page_view_counts', { p_restaurant_id: restaurantId, p_days: range }),
      supabase.from('menu_item_views').select('menu_item_id, created_at').eq('restaurant_id', restaurantId).gte('created_at', sinceIso),
      supabase.rpc('get_hourly_page_views', { p_restaurant_id: restaurantId, p_days: 7 }),
      supabase.rpc('get_item_avg_duration', { p_restaurant_id: restaurantId, p_days: 30 }),
      supabase.from('menu_items').select('id, name_tr, category_id').eq('restaurant_id', restaurantId),
      supabase.from('menu_categories').select('id, name_tr').eq('restaurant_id', restaurantId),
      supabase.rpc('get_total_page_views', { p_restaurant_id: restaurantId, p_days: range }),
    ]);

    setPageDaily((pvDaily.data as DayCount[]) ?? []);
    setHourly((hourlyRes.data as HourCount[]) ?? []);
    setItemDurations((durRes.data as ItemDuration[]) ?? []);
    setItems((itemsRes.data as Item[]) ?? []);
    setCategories((catsRes.data as Category[]) ?? []);
    setTotalPage((totalPv.data as number) ?? 0);

    // Aggregate item views by day client-side
    const ivMap = new Map<string, number>();
    const ivAll = (ivRows.data as { menu_item_id: string; created_at: string }[]) ?? [];
    for (const row of ivAll) {
      const k = row.created_at.slice(0, 10);
      ivMap.set(k, (ivMap.get(k) ?? 0) + 1);
    }
    setItemDaily(Array.from(ivMap.entries()).map(([view_date, view_count]) => ({ view_date, view_count })));
    setTotalItem(ivAll.length);

    setLoading(false);
  }

  const dateSeries = useMemo(() => {
    const days = lastNDays(range);
    const pvMap = new Map(pageDaily.map(r => [r.view_date, r.view_count]));
    const ivMap = new Map(itemDaily.map(r => [r.view_date, r.view_count]));
    return days.map(d => ({ date: d, page: pvMap.get(d) ?? 0, item: ivMap.get(d) ?? 0 }));
  }, [pageDaily, itemDaily, range]);

  const maxDay = Math.max(1, ...dateSeries.map(d => Math.max(d.page, d.item)));

  const trends = useMemo(() => {
    const weekPage = dateSeries.slice(-7).reduce((a, b) => a + b.page, 0);
    const prevWeekPage = dateSeries.slice(-14, -7).reduce((a, b) => a + b.page, 0);
    const weekItem = dateSeries.slice(-7).reduce((a, b) => a + b.item, 0);
    const prevWeekItem = dateSeries.slice(-14, -7).reduce((a, b) => a + b.item, 0);
    return {
      page: pct(weekPage, prevWeekPage),
      item: pct(weekItem, prevWeekItem),
    };
  }, [dateSeries]);

  const avgDuration = useMemo(() => {
    if (itemDurations.length === 0) return 0;
    let totalSec = 0;
    let totalCount = 0;
    for (const r of itemDurations) {
      totalSec += r.avg_duration * r.view_count;
      totalCount += r.view_count;
    }
    return totalCount === 0 ? 0 : Number((totalSec / totalCount).toFixed(1));
  }, [itemDurations]);

  const todayPageViews = dateSeries[dateSeries.length - 1]?.page ?? 0;

  const itemNameMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const categoryNameMap = useMemo(() => new Map(categories.map(c => [c.id, c.name_tr])), [categories]);

  const topItems = useMemo(() => {
    return itemDurations
      .slice(0, 10)
      .map(r => ({
        id: r.menu_item_id,
        name: itemNameMap.get(r.menu_item_id)?.name_tr ?? '—',
        clicks: r.view_count,
        avg: r.avg_duration,
      }));
  }, [itemDurations, itemNameMap]);

  const topCategories = useMemo(() => {
    const tally = new Map<string, number>();
    for (const r of itemDurations) {
      const cat = itemNameMap.get(r.menu_item_id)?.category_id;
      if (!cat) continue;
      tally.set(cat, (tally.get(cat) ?? 0) + r.view_count);
    }
    return Array.from(tally.entries())
      .map(([id, clicks]) => ({ id, name: categoryNameMap.get(id) ?? '—', clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  }, [itemDurations, itemNameMap, categoryNameMap]);

  const maxHourly = Math.max(1, ...hourly.map(h => h.view_count));
  const hourlyMap = new Map(hourly.map(h => [h.hour_of_day, h.view_count]));

  const Stat = ({ label, value, Icon, trend, sub }: { label: string; value: string | number; Icon: typeof Eye; trend?: number | null; sub?: string }) => (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: t.heading, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <Icon size={20} weight="thin" color={t.icon} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: t.value }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13 }}>
        {sub && <span style={{ color: t.subtle }}>{sub}</span>}
        {trend != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: trend >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {trend >= 0 ? <TrendUp size={12} weight="thin" /> : <TrendDown size={12} weight="thin" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Stat label="Menü Görüntülenme" value={totalPage} Icon={Eye} trend={trends.page} sub={`son ${range} gün`} />
        <Stat label="Ürün Tıklama" value={totalItem} Icon={CursorClick} trend={trends.item} sub={`son ${range} gün`} />
        <Stat label="Ort. İnceleme Süresi" value={`${avgDuration} sn`} Icon={Clock} />
        <Stat label="Bugün Görüntülenme" value={todayPageViews} Icon={CalendarBlank} />
      </div>

      {/* Daily chart */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: t.value, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ChartBar size={16} weight="thin" /> Günlük Görüntülenme
          </h4>
          <div style={{ display: 'flex', gap: 4 }}>
            {[7, 30].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRange(n as 7 | 30)}
                style={{
                  padding: '4px 10px', fontSize: 12, borderRadius: 8,
                  border: `1px solid ${range === n ? t.value : t.cardBorder}`,
                  background: range === n ? t.value : t.cardBg,
                  color: range === n ? t.cardBg : t.value,
                  cursor: 'pointer',
                }}
              >
                {n} gün
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: t.subtle, marginBottom: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BLUE, display: 'inline-block' }} /> Sayfa
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: PINK, display: 'inline-block' }} /> Ürün
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140, overflowX: 'auto' }}>
          {dateSeries.map(d => (
            <div key={d.date} title={`${d.date}: ${d.page} sayfa, ${d.item} ürün`} style={{ flex: '1 0 auto', minWidth: range === 7 ? 40 : 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1, width: '100%', justifyContent: 'center' }}>
                <div style={{ width: '40%', background: BLUE, height: `${(d.page / maxDay) * 100}%`, minHeight: d.page > 0 ? 2 : 0, borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: '40%', background: PINK, height: `${(d.item / maxDay) * 100}%`, minHeight: d.item > 0 ? 2 : 0, borderRadius: '2px 2px 0 0' }} />
              </div>
              {range === 7 && (
                <span style={{ fontSize: 9, color: t.subtle }}>{d.date.slice(5)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top items + categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <div style={card}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: t.value, margin: '0 0 12px 0' }}>En Çok Tıklanan Ürünler</h4>
          {topItems.length === 0 ? (
            <div style={{ fontSize: 13, color: t.subtle, textAlign: 'center', padding: 20 }}>Henüz veri yok</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ fontSize: 11, color: t.tableHeaderText, textAlign: 'left', textTransform: 'uppercase' }}>
                  <th style={{ padding: '6px 4px', fontWeight: 600, width: 24 }}>#</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Ürün</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right' }}>Tıklama</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600, textAlign: 'right' }}>Ort. Süre</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((it, i) => (
                  <tr key={it.id} style={{ borderTop: `1px solid ${t.divider}` }}>
                    <td style={{ padding: '6px 4px', color: t.subtle }}>{i + 1}</td>
                    <td style={{ padding: '6px 4px', color: t.value }}>{it.name}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{it.clicks}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', color: t.subtle }}>{it.avg} sn</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={card}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: t.value, margin: '0 0 12px 0' }}>Popüler Kategoriler</h4>
          {topCategories.length === 0 ? (
            <div style={{ fontSize: 13, color: t.subtle, textAlign: 'center', padding: 20 }}>Henüz veri yok</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCategories.map(c => {
                const max = topCategories[0].clicks || 1;
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: t.value }}>{c.name}</span>
                      <span style={{ color: t.subtle }}>{c.clicks}</span>
                    </div>
                    <div style={{ height: 6, background: t.divider, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.clicks / max) * 100}%`, background: PINK }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hourly heatmap */}
      <div style={card}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: t.value, margin: '0 0 12px 0' }}>
          Saat Bazlı Yoğunluk <span style={{ fontWeight: 400, fontSize: 11, color: t.subtle }}>son 7 gün</span>
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
          {Array.from({ length: 24 }, (_, h) => {
            const count = hourlyMap.get(h) ?? 0;
            const intensity = count / maxHourly;
            const bg = count === 0
              ? t.divider
              : `rgba(255,79,122,${Math.max(0.15, intensity)})`;
            return (
              <div
                key={h}
                title={`${h}:00 — ${count} görüntülenme`}
                style={{
                  aspectRatio: '1',
                  background: bg,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: intensity > 0.5 ? '#FFFFFF' : '#6B6B6F',
                  fontWeight: 500,
                }}
              >
                {h}
              </div>
            );
          })}
        </div>
      </div>

      {loading && <div style={{ fontSize: 12, color: t.subtle, textAlign: 'center' }}>Yükleniyor...</div>}
    </div>
  );
}
