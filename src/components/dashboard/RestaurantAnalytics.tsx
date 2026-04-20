// src/components/dashboard/RestaurantAnalytics.tsx
// Attio-stili Dashboard — 7 bölüm
// 1) Page Header + date range selector
// 2) 4 Metric cards
// 3) Chart row (time series + top 5 items)
// 4) Secondary row (category bars + recent activity)
// 5) Heatmap (hourly traffic, last 7 days)
// 6) Tutorials
//
// Dashboard admin tema seçiminden bağımsızdır — white bg, accent yeşil #10B981

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Bell,
  CaretDown,
  ChatCircle,
  ForkKnife,
  PlayCircle,
  Star,
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabase';

/* ---------------------------------- Props --------------------------------- */

interface Props {
  restaurantId: string;
  featureWaiterCalls: boolean;
  featureFeedback: boolean;
  featureReviews: boolean;
  onNavigate?: (tab: string) => void;
}

/* --------------------------------- Palette -------------------------------- */

const C = {
  pageBg: '#F7F7F5',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardBorderHover: '#D1D5DB',
  textPrimary: '#1C1C1E',
  textSecondary: '#6B6B6F',
  textTertiary: '#9CA3AF',
  accent: '#10B981',
  accentSoft: '#A7F3D0',
  track: '#F7F7F8',
  divider: '#F1F3F5',
  barNeutral: '#1C1C1E',
  shadowNone: 'none',
};

const FONT = "'Roboto', sans-serif";

/* --------------------------------- Types --------------------------------- */

type DateRangeKey = 'today' | 'week' | 'month' | 'quarter';

const RANGE_DAYS: Record<DateRangeKey, number> = { today: 1, week: 7, month: 30, quarter: 90 };
const RANGE_LABELS: Record<DateRangeKey, string> = {
  today: 'Bugün',
  week: 'Son 7 gün',
  month: 'Son 30 gün',
  quarter: 'Son 90 gün',
};
const RANGE_NOUN: Record<DateRangeKey, string> = {
  today: 'gün',
  week: '7 gün',
  month: '30 gün',
  quarter: '90 gün',
};

interface PageViewRow {
  fingerprint: string | null;
  created_at: string;
}
interface ItemViewRow {
  menu_item_id: string;
  created_at: string;
}
interface MenuItemRow {
  id: string;
  name_tr: string;
  image_url: string | null;
  category_id: string | null;
}
interface CategoryRow {
  id: string;
  name_tr: string;
}
interface DailyCount {
  view_date: string;
  view_count: number;
}
interface HourlyCount {
  hour_of_day: number;
  view_count: number;
}
interface ActivityItem {
  kind: 'feedback' | 'call' | 'review';
  id: string;
  created_at: string;
  text: string;
  sub?: string;
}
interface DashData {
  pageViews: PageViewRow[];
  itemViews: ItemViewRow[];
  items: MenuItemRow[];
  categories: CategoryRow[];
  daily: DailyCount[];
  hourly: HourlyCount[];
  activities: ActivityItem[];
}

/* --------------------------------- Helpers -------------------------------- */

const TR_TZ = 'Europe/Istanbul';

function dateKey(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const dd = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${dd}`;
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(dateKey(new Date(now - i * 86400000)));
  return out;
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

const trNumber = (n: number) => new Intl.NumberFormat('tr-TR').format(n);

function relativeTimeTR(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} sn önce`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  const w = Math.floor(d / 7);
  return `${w} hf önce`;
}

function shortDateTR(ymd: string): string {
  const [, m, d] = ymd.split('-');
  const month = Number(m);
  const names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${Number(d)} ${names[month - 1] ?? ''}`;
}

/* ------------------------------- Shared styles ---------------------------- */

const cardStyle: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: 10,
  padding: 20,
  boxShadow: C.shadowNone,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: C.textPrimary,
  margin: 0,
  letterSpacing: '-0.01em',
};

const skeletonBlockStyle = (h: number): React.CSSProperties => ({
  height: h,
  borderRadius: 6,
  background:
    'linear-gradient(90deg, #F1F3F5 0%, #E5E7EB 50%, #F1F3F5 100%)',
  backgroundSize: '200% 100%',
  animation: 'dash-shimmer 1.6s infinite linear',
});

/* -------------------------------- Sub-pieces ------------------------------ */

function DateRangeSelector({
  value,
  onChange,
}: {
  value: DateRangeKey;
  onChange: (v: DateRangeKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: C.cardBg,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 999,
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 500,
          color: C.textPrimary,
          cursor: 'pointer',
        }}
      >
        {RANGE_LABELS[value]}
        <CaretDown size={14} weight="thin" />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 30,
            minWidth: 160,
            background: C.cardBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            padding: 4,
          }}
        >
          {(Object.keys(RANGE_LABELS) as DateRangeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: k === value ? C.track : 'transparent',
                border: 'none',
                borderRadius: 6,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: k === value ? 600 : 400,
                color: C.textPrimary,
                cursor: 'pointer',
              }}
            >
              {RANGE_LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span style={{ fontSize: 12, color: C.textSecondary }}>—</span>;
  }
  const positive = delta > 0;
  const sign = positive ? '+' : delta < 0 ? '' : '';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 12,
        fontWeight: 500,
        color: positive ? C.accent : C.textSecondary,
      }}
    >
      {positive && <ArrowUp size={12} weight="thin" />}
      {sign}
      {delta.toFixed(1)}%
    </span>
  );
}

function MetricCard({
  label,
  value,
  delta,
  sub,
  valueSize = 28,
  valueLineHeight,
}: {
  label: string;
  value: string;
  delta?: number | null;
  sub?: string;
  valueSize?: number;
  valueLineHeight?: number;
}) {
  return (
    <div
      style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 116 }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: C.textTertiary,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: valueSize,
          fontWeight: 700,
          color: C.textPrimary,
          lineHeight: valueLineHeight ?? 1.1,
          letterSpacing: '-0.02em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.textSecondary }}>
        {delta !== undefined && <DeltaPill delta={delta} />}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/* -------------------------------- Line chart ------------------------------ */

function TimeSeriesChart({
  series,
  range,
}: {
  series: Array<{ date: string; count: number }>;
  range: DateRangeKey;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 100; // use viewBox pct
  const height = 100;
  const padX = 4;
  const padY = 6;

  const max = Math.max(1, ...series.map((s) => s.count));
  const step = series.length > 1 ? (width - padX * 2) / (series.length - 1) : 0;
  const points = series.map((s, i) => {
    const x = padX + i * step;
    const y = padY + (height - padY * 2) * (1 - s.count / max);
    return { x, y, ...s };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  const yTicks = [0, 0.33, 0.66, 1].map((t) => ({
    y: padY + (height - padY * 2) * (1 - t),
    label: Math.round(max * t),
  }));

  const labelEvery = range === 'quarter' ? 15 : range === 'month' ? 6 : 1;

  return (
    <div style={{ ...cardStyle, height: 280, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={sectionTitleStyle}>Zaman İçinde Görüntülenme</h3>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: C.textSecondary,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.accent,
            }}
          />
          Menü görüntülemeleri
        </span>
      </div>

      {series.length === 0 || max === 1 ? (
        <EmptyState label="Henüz veri yok" height={200} />
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: 12, position: 'relative' }}>
          {/* Y-axis labels */}
          <div
            style={{
              width: 36,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              paddingBottom: 18,
              paddingTop: 2,
              fontSize: 11,
              color: C.textTertiary,
              textAlign: 'right',
            }}
          >
            {[...yTicks].reverse().map((t, i) => (
              <span key={i}>{trNumber(t.label)}</span>
            ))}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {yTicks.map((t, i) => (
                <line
                  key={i}
                  x1={padX}
                  x2={width - padX}
                  y1={t.y}
                  y2={t.y}
                  stroke={C.divider}
                  strokeWidth={0.3}
                />
              ))}
              <polyline
                fill="none"
                stroke={C.accent}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polyline}
                vectorEffect="non-scaling-stroke"
              />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={0.8} fill={C.accent} />
                  {/* invisible hover zone */}
                  <rect
                    x={p.x - step / 2}
                    y={0}
                    width={step || 2}
                    height={height}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx((idx) => (idx === i ? null : idx))}
                    style={{ cursor: 'default' }}
                  />
                </g>
              ))}
            </svg>

            {/* X-axis labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 2,
                fontSize: 11,
                color: C.textTertiary,
              }}
            >
              {series.map((s, i) => (
                <span
                  key={s.date}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    visibility: i % labelEvery === 0 || i === series.length - 1 ? 'visible' : 'hidden',
                  }}
                >
                  {shortDateTR(s.date)}
                </span>
              ))}
            </div>

            {/* Tooltip */}
            {hoverIdx !== null && points[hoverIdx] && (
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${points[hoverIdx].x}% - 50px)`,
                  top: `calc(${points[hoverIdx].y}% - 40px)`,
                  background: C.textPrimary,
                  color: C.cardBg,
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {shortDateTR(series[hoverIdx].date)}: {trNumber(series[hoverIdx].count)} görüntüleme
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Top 5 items ------------------------------- */

function TopItemsCard({
  rows,
}: {
  rows: Array<{ id: string; name: string; category: string; count: number; image: string | null }>;
}) {
  return (
    <div style={{ ...cardStyle, height: 280, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>En Çok Görüntülenen 5 Ürün</h3>
      {rows.length === 0 ? (
        <EmptyState label="Henüz veri yok" height={200} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          {rows.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingTop: i === 0 ? 0 : 8,
                paddingBottom: 8,
                borderBottom: i < rows.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: C.track,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {r.image ? (
                  <img
                    src={r.image}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ForkKnife size={16} weight="thin" color={C.textTertiary} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: C.textTertiary }}>{r.category}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>
                  {trNumber(r.count)}
                </div>
                <div style={{ fontSize: 11, color: C.textTertiary }}>görüntüleme</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------- Category bar performance ----------------------- */

function CategoryBars({ rows }: { rows: Array<{ id: string; name: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div style={cardStyle}>
      <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>Kategori Performansı</h3>
      {rows.length === 0 ? (
        <EmptyState label="Henüz veri yok" height={160} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r, i) => {
            const pct = (r.count / max) * 100;
            const isTop = i === 0;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 110,
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flexShrink: 0,
                  }}
                >
                  {r.name}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: C.track,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isTop ? C.accent : C.barNeutral,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 44,
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.textPrimary,
                  }}
                >
                  {trNumber(r.count)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Recent activities --------------------------- */

function ActivityFeed({
  items,
  onSeeAll,
}: {
  items: ActivityItem[];
  onSeeAll?: () => void;
}) {
  const renderIcon = (kind: ActivityItem['kind']) => {
    if (kind === 'feedback') return <ChatCircle size={14} weight="thin" color={C.textSecondary} />;
    if (kind === 'call') return <Bell size={14} weight="thin" color={C.textSecondary} />;
    return <Star size={14} weight="thin" color={C.textSecondary} />;
  };
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={sectionTitleStyle}>Son Aktiviteler</h3>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: C.accent,
              fontWeight: 500,
              padding: 0,
            }}
          >
            Tümünü gör
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState label="Henüz aktivite yok" height={160} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((a, i) => (
            <div
              key={`${a.kind}-${a.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < items.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
              }}
            >
              <div style={{ flexShrink: 0 }}>{renderIcon(a.kind)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: C.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.text}
                </div>
                {a.sub && <div style={{ fontSize: 12, color: C.textTertiary }}>{a.sub}</div>}
              </div>
              <div style={{ fontSize: 11, color: C.textTertiary, flexShrink: 0 }}>
                {relativeTimeTR(a.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Heatmap ------------------------------ */

function HourlyHeatmap({ hourly }: { hourly: HourlyCount[] }) {
  const map = new Map(hourly.map((h) => [h.hour_of_day, h.view_count]));
  const max = Math.max(1, ...hourly.map((h) => h.view_count));
  const cells = Array.from({ length: 24 }, (_, h) => {
    const v = map.get(h) ?? 0;
    const ratio = v / max;
    let bg: string;
    let fg: string;
    if (ratio === 0) {
      bg = C.track;
      fg = C.textTertiary;
    } else if (ratio < 0.4) {
      bg = C.accentSoft;
      fg = C.textPrimary;
    } else {
      bg = C.accent;
      fg = C.cardBg;
    }
    return { h, v, bg, fg };
  });

  const total = hourly.reduce((s, h) => s + h.view_count, 0);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h3 style={sectionTitleStyle}>Saat Bazlı Yoğunluk</h3>
        <span style={{ fontSize: 12, color: C.textSecondary }}>Son 7 gün</span>
      </div>
      {total === 0 ? (
        <EmptyState label="Henüz veri yok" height={120} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
            gap: 4,
          }}
        >
          {cells.map((c) => (
            <div
              key={c.h}
              title={`${String(c.h).padStart(2, '0')}:00 — ${trNumber(c.v)} görüntüleme`}
              style={{
                height: 36,
                borderRadius: 6,
                background: c.bg,
                color: c.fg,
                fontSize: 11,
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {c.h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Tutorials ------------------------------ */

const TUTORIALS: Array<{ title: string; desc: string }> = [
  { title: 'Menü oluşturmaya başlayın', desc: 'İlk ürününüzü ekleyin ve QR kodunuzu yazdırın' },
  { title: 'AI ile ürün açıklaması', desc: 'Yapay zeka ile dakikalar içinde profesyonel açıklamalar' },
  { title: 'Menünüzü çoklu dilde sunun', desc: '34 dile otomatik çeviri ile global müşterilere ulaşın' },
  { title: 'Analitiği anlama', desc: 'Menü performansınızı takip edin ve iyileştirin' },
];

function Tutorials() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={sectionTitleStyle}>Eğitim Videoları ve Kılavuzlar</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textSecondary }}>
            Tabbled'dan en iyi şekilde yararlanmak için
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: C.accent,
            fontWeight: 500,
            padding: 0,
          }}
        >
          Kütüphaneyi gör
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
      >
        {TUTORIALS.map((t) => (
          <div
            key={t.title}
            style={{
              background: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 10,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => {
              /* video modal - future */
            }}
          >
            <div
              style={{
                aspectRatio: '16 / 9',
                background: C.track,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: C.cardBg,
                  border: `1px solid ${C.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlayCircle size={32} weight="thin" color={C.textPrimary} />
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: 4 }}>
                {t.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                {t.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Shared UI ------------------------------ */

function EmptyState({ label, height = 140 }: { label: string; height?: number }) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.textTertiary,
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}

/* ------------------------------- Data loading ----------------------------- */

async function loadAll(
  restaurantId: string,
  range: DateRangeKey,
  features: { feedback: boolean; calls: boolean; reviews: boolean }
): Promise<DashData> {
  const days = RANGE_DAYS[range];
  const now = Date.now();
  const currentStart = new Date(now - days * 86400000).toISOString();
  const prevStart = new Date(now - days * 2 * 86400000).toISOString();

  const [pvRes, ivRes, itemsRes, catsRes, dailyRes, hourlyRes, fbRes, callsRes, revRes] =
    await Promise.all([
      supabase
        .from('menu_page_views')
        .select('fingerprint, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', prevStart),
      supabase
        .from('menu_item_views')
        .select('menu_item_id, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', prevStart),
      supabase
        .from('menu_items')
        .select('id, name_tr, image_url, category_id')
        .eq('restaurant_id', restaurantId),
      supabase.from('menu_categories').select('id, name_tr').eq('restaurant_id', restaurantId),
      supabase.rpc('get_page_view_counts', { p_restaurant_id: restaurantId, p_days: days }),
      supabase.rpc('get_hourly_page_views', { p_restaurant_id: restaurantId, p_days: 7 }),
      features.feedback
        ? supabase
            .from('feedback')
            .select('id, table_number, created_at, rating')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] as Array<{ id: string; table_number: string | null; created_at: string; rating: number }> }),
      features.calls
        ? supabase
            .from('waiter_calls')
            .select('id, table_number, created_at')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] as Array<{ id: string; table_number: string | null; created_at: string }> }),
      features.reviews
        ? supabase
            .from('reviews')
            .select('id, rating, created_at')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(2)
        : Promise.resolve({ data: [] as Array<{ id: string; rating: number; created_at: string }> }),
    ]);

  const pageViews = (pvRes.data ?? []) as PageViewRow[];
  const itemViews = (ivRes.data ?? []) as ItemViewRow[];
  const items = (itemsRes.data ?? []) as MenuItemRow[];
  const categories = (catsRes.data ?? []) as CategoryRow[];
  const daily = (dailyRes.data ?? []) as DailyCount[];
  const hourly = (hourlyRes.data ?? []) as HourlyCount[];

  const fbRows = (fbRes.data ?? []) as Array<{ id: string; table_number: string | null; created_at: string; rating: number }>;
  const callRows = (callsRes.data ?? []) as Array<{ id: string; table_number: string | null; created_at: string }>;
  const revRows = (revRes.data ?? []) as Array<{ id: string; rating: number; created_at: string }>;

  const activities: ActivityItem[] = [
    ...fbRows.map<ActivityItem>((r) => ({
      kind: 'feedback',
      id: r.id,
      created_at: r.created_at,
      text: 'Yeni geri bildirim alındı',
      sub: r.table_number ? `Masa ${r.table_number}` : undefined,
    })),
    ...callRows.map<ActivityItem>((r) => ({
      kind: 'call',
      id: r.id,
      created_at: r.created_at,
      text: 'Garson çağrıldı',
      sub: r.table_number ? `Masa ${r.table_number}` : undefined,
    })),
    ...revRows.map<ActivityItem>((r) => ({
      kind: 'review',
      id: r.id,
      created_at: r.created_at,
      text: `Yeni değerlendirme: ${r.rating} yıldız`,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return { pageViews, itemViews, items, categories, daily, hourly, activities };
}

/* ----------------------------------- Root --------------------------------- */

export default function RestaurantAnalytics({
  restaurantId,
  featureWaiterCalls,
  featureFeedback,
  featureReviews,
  onNavigate,
}: Props) {
  const [range, setRange] = useState<DateRangeKey>('month');
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    loadAll(restaurantId, range, {
      feedback: featureFeedback,
      calls: featureWaiterCalls,
      reviews: featureReviews,
    })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Dashboard data load error:', err);
        setErrored(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, range, featureFeedback, featureWaiterCalls, featureReviews]);

  /* --- derived values --- */

  const derived = useMemo(() => {
    if (!data) {
      return null;
    }
    const days = RANGE_DAYS[range];
    const now = Date.now();
    const currentStartMs = now - days * 86400000;
    const prevStartMs = now - days * 2 * 86400000;

    const pvCurrent = data.pageViews.filter((r) => new Date(r.created_at).getTime() >= currentStartMs);
    const pvPrev = data.pageViews.filter((r) => {
      const ms = new Date(r.created_at).getTime();
      return ms >= prevStartMs && ms < currentStartMs;
    });

    const ivCurrent = data.itemViews.filter((r) => new Date(r.created_at).getTime() >= currentStartMs);
    const ivPrev = data.itemViews.filter((r) => {
      const ms = new Date(r.created_at).getTime();
      return ms >= prevStartMs && ms < currentStartMs;
    });

    const pageViewsTotal = pvCurrent.length;
    const pageViewsDelta = pctDelta(pvCurrent.length, pvPrev.length);

    const uniqueVisitors = new Set(pvCurrent.map((r) => r.fingerprint ?? '').filter((x) => x !== '')).size;
    const uniqueVisitorsPrev = new Set(pvPrev.map((r) => r.fingerprint ?? '').filter((x) => x !== '')).size;
    const uniqueDelta = pctDelta(uniqueVisitors, uniqueVisitorsPrev);

    const itemClicks = ivCurrent.length;
    const itemClicksDelta = pctDelta(ivCurrent.length, ivPrev.length);

    // Top item
    const itemMap = new Map(data.items.map((i) => [i.id, i]));
    const catMap = new Map(data.categories.map((c) => [c.id, c.name_tr]));
    const itemCounts = new Map<string, number>();
    for (const r of ivCurrent) {
      itemCounts.set(r.menu_item_id, (itemCounts.get(r.menu_item_id) ?? 0) + 1);
    }
    const itemCountList = Array.from(itemCounts.entries())
      .map(([id, count]) => {
        const item = itemMap.get(id);
        return {
          id,
          count,
          name: item?.name_tr ?? '—',
          category: (item?.category_id && catMap.get(item.category_id)) || '—',
          image: item?.image_url ?? null,
        };
      })
      .filter((r) => r.name !== '—')
      .sort((a, b) => b.count - a.count);

    const topItem = itemCountList[0] ?? null;
    const topItemsList = itemCountList.slice(0, 5);

    // Category tally
    const catCounts = new Map<string, number>();
    for (const r of ivCurrent) {
      const item = itemMap.get(r.menu_item_id);
      if (!item?.category_id) continue;
      catCounts.set(item.category_id, (catCounts.get(item.category_id) ?? 0) + 1);
    }
    const categoryBars = Array.from(catCounts.entries())
      .map(([id, count]) => ({ id, name: catMap.get(id) ?? '—', count }))
      .filter((r) => r.name !== '—')
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Line chart series — fill missing days with 0
    const days2 = lastNDays(days);
    const dailyMap = new Map(data.daily.map((d) => [d.view_date, Number(d.view_count)]));
    const chartSeries = days2.map((d) => ({ date: d, count: dailyMap.get(d) ?? 0 }));

    return {
      pageViewsTotal,
      pageViewsDelta,
      uniqueVisitors,
      uniqueDelta,
      itemClicks,
      itemClicksDelta,
      topItem,
      topItemsList,
      categoryBars,
      chartSeries,
    };
  }, [data, range]);

  /* --------------------------------- Render ------------------------------- */

  return (
    <div
      style={{
        padding: '4px 0 32px',
        fontFamily: FONT,
        background: 'transparent',
      }}
    >
      <style>{`
        @keyframes dash-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* BÖLÜM 1 — Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: C.textPrimary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textSecondary }}>
            Menü performansınıza genel bakış
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {errored ? (
        <div style={{ ...cardStyle, color: C.textTertiary, fontSize: 13, textAlign: 'center' }}>
          Veriler yüklenemedi
        </div>
      ) : loading || !derived ? (
        <DashboardSkeleton />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* BÖLÜM 2 — Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 16,
            }}
          >
            <MetricCard
              label="MENÜ GÖRÜNTÜLEME"
              value={trNumber(derived.pageViewsTotal)}
              delta={derived.pageViewsDelta}
              sub={`vs. önceki ${RANGE_NOUN[range]}`}
            />
            <MetricCard
              label="TEKİL ZİYARETÇİ"
              value={trNumber(derived.uniqueVisitors)}
              delta={derived.uniqueDelta}
              sub={`vs. önceki ${RANGE_NOUN[range]}`}
            />
            <MetricCard
              label="EN ÇOK GÖRÜNTÜLENEN ÜRÜN"
              value={derived.topItem?.name ?? 'Henüz veri yok'}
              valueSize={derived.topItem ? 18 : 14}
              valueLineHeight={1.25}
              sub={
                derived.topItem
                  ? `${trNumber(derived.topItem.count)} görüntüleme`
                  : undefined
              }
            />
            <MetricCard
              label="ÜRÜN TIKLAMA"
              value={trNumber(derived.itemClicks)}
              delta={derived.itemClicksDelta}
              sub={`vs. önceki ${RANGE_NOUN[range]}`}
            />
          </div>

          {/* BÖLÜM 3 — Chart row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 16,
            }}
            className="dash-chart-row"
          >
            <TimeSeriesChart series={derived.chartSeries} range={range} />
            <TopItemsCard rows={derived.topItemsList} />
          </div>

          {/* BÖLÜM 4 — Secondary row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            <CategoryBars rows={derived.categoryBars} />
            <ActivityFeed
              items={data!.activities}
              onSeeAll={onNavigate ? () => onNavigate('feedback') : undefined}
            />
          </div>

          {/* BÖLÜM 5 — Heatmap */}
          <HourlyHeatmap hourly={data!.hourly} />

          {/* BÖLÜM 6 — Tutorials */}
          <Tutorials />
        </div>
      )}

      {/* Responsive tweak: chart row collapses on mobile */}
      <style>{`
        @media (max-width: 720px) {
          .dash-chart-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={cardStyle}>
            <div style={skeletonBlockStyle(12)} />
            <div style={{ height: 10 }} />
            <div style={skeletonBlockStyle(28)} />
            <div style={{ height: 10 }} />
            <div style={skeletonBlockStyle(12)} />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <div style={{ ...cardStyle, height: 280 }}>
          <div style={skeletonBlockStyle(240)} />
        </div>
        <div style={{ ...cardStyle, height: 280 }}>
          <div style={skeletonBlockStyle(240)} />
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={skeletonBlockStyle(160)} />
        </div>
        <div style={cardStyle}>
          <div style={skeletonBlockStyle(160)} />
        </div>
      </div>
      <div style={cardStyle}>
        <div style={skeletonBlockStyle(120)} />
      </div>
      <div style={cardStyle}>
        <div style={skeletonBlockStyle(180)} />
      </div>
    </div>
  );
}

