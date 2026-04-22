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

/**
 * Line chart — reference mockup şeması:
 * - Sabit viewBox 780x240, preserveAspectRatio="none"
 * - padL=36, padR=16, padT=16, padB=28 (Y label sol, X label alt için)
 * - Smooth cubic path (monotone-ish), clamped
 * - Hover tooltip: ince dashed dikey çizgi + nokta + siyah pill
 * Kart yüksekliği sabit 320 → overflow: hidden ile taşmaz.
 */
function TimeSeriesChart({
  series,
  range,
}: {
  series: Array<{ date: string; count: number }>;
  range: DateRangeKey;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 780;
  const H = 240;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(1, ...series.map((s) => s.count));
  const yMax = niceCeil(max);
  const n = series.length;
  const xAt = (i: number) => padL + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const yAt = (v: number) => padT + innerH - (v / yMax) * innerH;

  const pts = series.map((s, i) => ({ x: xAt(i), y: yAt(s.count) }));
  const d = smoothPath(pts);
  const areaD =
    pts.length > 0
      ? `${d} L ${pts[pts.length - 1].x.toFixed(2)} ${(padT + innerH).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`
      : '';

  const yTickValues = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t));
  const labelIdxs = evenlySpacedIndexes(n, range === 'today' ? 1 : range === 'week' ? 7 : 5);

  const hasData = max > 0 && n > 0;

  return (
    <div
      style={{
        ...cardStyle,
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
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

      {!hasData ? (
        <EmptyState label="Henüz veri yok" height={240} />
      ) : (
        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="dash-line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
                <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y gridlines + labels */}
            {yTickValues.map((v, i) => {
              const y = yAt(v);
              return (
                <g key={i}>
                  <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#F2F3F5" strokeWidth={1} />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontFamily="Roboto"
                    fontSize={11}
                    fontWeight={400}
                    fill={C.textTertiary}
                  >
                    {trNumber(v)}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            {areaD && <path d={areaD} fill="url(#dash-line-fill)" />}

            {/* Line */}
            <path d={d} fill="none" stroke={C.accent} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />

            {/* Hover guide line + point */}
            {hoverIdx !== null && pts[hoverIdx] && (
              <>
                <line
                  x1={pts[hoverIdx].x}
                  x2={pts[hoverIdx].x}
                  y1={padT}
                  y2={H - padB}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <circle
                  cx={pts[hoverIdx].x}
                  cy={pts[hoverIdx].y}
                  r={5}
                  fill="#FFFFFF"
                  stroke={C.accent}
                  strokeWidth={1.75}
                />
              </>
            )}

            {/* X-axis labels */}
            {labelIdxs.map((i) => (
              <text
                key={i}
                x={xAt(i)}
                y={H - 8}
                textAnchor="middle"
                fontFamily="Roboto"
                fontSize={11}
                fontWeight={400}
                fill={C.textTertiary}
              >
                {shortDateTR(series[i].date)}
              </text>
            ))}

            {/* Invisible hover zones (one wide band per point) */}
            {pts.map((p, i) => {
              const band = n > 1 ? innerW / (n - 1) : innerW;
              return (
                <rect
                  key={i}
                  x={p.x - band / 2}
                  y={padT}
                  width={band}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx((idx) => (idx === i ? null : idx))}
                />
              );
            })}
          </svg>

          {/* Tooltip (positioned absolutely over SVG using percentages relative to container) */}
          {hoverIdx !== null && pts[hoverIdx] && (
            <div
              style={{
                position: 'absolute',
                left: `${(pts[hoverIdx].x / W) * 100}%`,
                top: `calc(${(pts[hoverIdx].y / H) * 100}% - 52px)`,
                transform: 'translateX(-50%)',
                background: C.textPrimary,
                color: C.cardBg,
                padding: '7px 10px',
                borderRadius: 6,
                fontSize: 12,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                lineHeight: 1.3,
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>
                {shortDateTR(series[hoverIdx].date)}
              </div>
              <div style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {trNumber(series[hoverIdx].count)} görüntüleme
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Smooth cubic path helper (monotone-ish) — referans HTML'den uyarlandı */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  let out = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    out += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return out;
}

/* Nice round ceiling — so Y-max is readable (10, 25, 50, 100, 250, ...) */
function niceCeil(n: number): number {
  if (n <= 1) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const mult = n / exp;
  let nice: number;
  if (mult <= 1) nice = 1;
  else if (mult <= 2) nice = 2;
  else if (mult <= 2.5) nice = 2.5;
  else if (mult <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

/* Evenly spaced index picks for x-axis labels */
function evenlySpacedIndexes(n: number, count: number): number[] {
  if (n <= 0) return [];
  if (n <= count) return Array.from({ length: n }, (_, i) => i);
  const step = (n - 1) / (count - 1);
  const set = new Set<number>();
  for (let k = 0; k < count; k++) set.add(Math.round(k * step));
  return Array.from(set).sort((a, b) => a - b);
}

/* ------------------------------ Top 5 items ------------------------------- */

function TopItemsCard({
  rows,
}: {
  rows: Array<{ id: string; name: string; category: string; count: number; image: string | null }>;
}) {
  return (
    <div style={{ ...cardStyle, height: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>En Çok Görüntülenen 5 Ürün</h3>
      {rows.length === 0 ? (
        <EmptyState label="Henüz veri yok" height={240} />
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
  if (rows.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>Kategori Performansı</h3>
        <EmptyState label="Henüz veri yok" height={160} />
      </div>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div style={cardStyle}>
      <h3 style={{ ...sectionTitleStyle, marginBottom: 14 }}>Kategori Performansı</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
        {rows.map((r, i) => {
          const pct = (r.count / max) * 100;
          const isTop = i === 0;
          return (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 48px',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  height: 6,
                  background: C.track,
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: isTop ? C.accent : C.barNeutral,
                    borderRadius: 999,
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.textPrimary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {trNumber(r.count)}
              </div>
            </div>
          );
        })}
      </div>
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

/* --------------------------------- Bar Chart ----------------------------- */

function HourlyBarChart({ hourly }: { hourly: HourlyCount[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const hours = Array.from({ length: 24 }, (_, h) => {
    const found = hourly.find((d) => d.hour_of_day === h);
    return { hour: h, count: found ? found.view_count : 0 };
  });

  const total = hours.reduce((s, d) => s + d.count, 0);
  const maxV = Math.max(1, ...hours.map((d) => d.count));
  const peakHour = hours.reduce((a, b) => (b.count > a.count ? b : a)).hour;

  const W = 860;
  const H = 240;
  const M = { top: 20, right: 20, bottom: 32, left: 36 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const band = innerW / 24;
  const barW = band * 0.7;
  const barX = (i: number) => i * band + band * 0.15;
  const centerX = (i: number) => i * band + band / 2;
  const yScale = (v: number) => innerH - (v / maxV) * innerH;

  const yTicks = [0, 1, 2, 3, 4].map((i) => ({
    y: (innerH / 4) * i,
    value: Math.round(maxV - (maxV / 4) * i),
  }));

  const handleHover = (e: React.MouseEvent, d: { hour: number; count: number }) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 36,
      text: `${String(d.hour).padStart(2, '0')}:00 — ${trNumber(d.count)} görüntüleme`,
    });
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h3 style={sectionTitleStyle}>Saat Bazlı Yoğunluk</h3>
        <span style={{ fontSize: 12, color: C.textSecondary }}>Son 7 gün</span>
      </div>
      {total === 0 ? (
        <EmptyState label="Henüz veri yok" height={120} />
      ) : (
        <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: 240 }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}
          >
            <g transform={`translate(${M.left},${M.top})`}>
              {yTicks.map((t) => (
                <g key={t.y}>
                  <line x1={0} y1={t.y} x2={innerW} y2={t.y} stroke="#F3F4F6" strokeWidth={1} />
                  <text x={-8} y={t.y + 4} textAnchor="end" style={{ fontSize: 11, fill: '#9CA3AF' }}>
                    {t.value}
                  </text>
                </g>
              ))}

              {hours.map((d, i) => {
                if (d.count === 0) return null;
                const y = yScale(d.count);
                const h = innerH - y;
                const fill = d.hour === peakHour ? C.accent : C.accentSoft;
                return (
                  <rect
                    key={d.hour}
                    x={barX(i)}
                    y={y}
                    width={barW}
                    height={h}
                    rx={3}
                    fill={fill}
                    style={{ cursor: 'pointer', transition: 'fill 120ms' }}
                    onMouseEnter={(e) => handleHover(e, d)}
                    onMouseMove={(e) => handleHover(e, d)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}

              {hours.map((d, i) => {
                if (d.hour % 3 !== 0 && d.hour !== peakHour) return null;
                const isPeak = d.hour === peakHour;
                return (
                  <text
                    key={`lbl-${d.hour}`}
                    x={centerX(i)}
                    y={innerH + 18}
                    textAnchor="middle"
                    style={{
                      fontSize: 11,
                      fill: isPeak ? C.accent : '#6B7280',
                      fontWeight: isPeak ? 700 : 400,
                    }}
                  >
                    {String(d.hour).padStart(2, '0')}
                  </text>
                );
              })}
            </g>
          </svg>

          {tooltip && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%)',
                background: '#1C1C1E',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 10,
              }}
            >
              {tooltip.text}
            </div>
          )}
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
        className="dash-video-grid"
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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
            className="dash-row-metrics"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
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
            className="dash-row-2-1"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
              gap: 16,
            }}
          >
            <TimeSeriesChart series={derived.chartSeries} range={range} />
            <TopItemsCard rows={derived.topItemsList} />
          </div>

          {/* BÖLÜM 4 — Secondary row */}
          <div
            className="dash-row-1-1"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
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
          <HourlyBarChart hourly={data!.hourly} />

          {/* BÖLÜM 6 — Tutorials */}
          <Tutorials />
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .dash-row-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .dash-video-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 720px) {
          .dash-row-2-1,
          .dash-row-1-1 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .dash-row-metrics { grid-template-columns: 1fr !important; }
          .dash-video-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="dash-row-metrics"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
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
        className="dash-row-2-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 16,
        }}
      >
        <div style={{ ...cardStyle, height: 320 }}>
          <div style={skeletonBlockStyle(280)} />
        </div>
        <div style={{ ...cardStyle, height: 320 }}>
          <div style={skeletonBlockStyle(280)} />
        </div>
      </div>
      <div
        className="dash-row-1-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
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

