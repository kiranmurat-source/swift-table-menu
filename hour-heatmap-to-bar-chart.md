# TABBLED — Replace Hour Heatmap with Bar Chart in Dashboard

## PROJECT CONTEXT

- Tabbled production SaaS, 23 days to hard launch (15 May)
- VPS: `/opt/khp/tabbled/` on `root@168.119.234.186`
- Stack: React + Vite + TypeScript + inline styles (S.* pattern, no shadcn internal use)
- Dashboard file: `src/components/dashboard/RestaurantAnalytics.tsx` (fully rewritten April 20 — 950 lines, Attio CRM style, accent #10B981)

## CONTEXT

The admin Dashboard has a "Saat Bazlı Yoğunluk" (Hourly Traffic) section that currently renders 24 colored squares — one per hour — with color intensity indicating traffic volume (heatmap pattern). User decided this is harder to read than a bar chart and requested a swap.

**Current (to be removed):** 24 rounded squares, color intensity = volume.
**New (to be added):** 24 vertical bars, height = volume. Peak bar darker, others lighter. Hover tooltip with exact count.

Data source is unchanged: `get_hourly_page_views` RPC (existing, returns `{ hour_of_day: number, view_count: number }[]` for the selected date range).

---

## TASK

### Step 1 — Read current implementation

Find the "Saat Bazlı Yoğunluk" section in `RestaurantAnalytics.tsx`. It's likely around line 1000-1100 based on the 950-line rewrite (the file has grown slightly since). Use:

```bash
cd /opt/khp/tabbled
grep -n "Saat Bazlı\|hourly\|heatmap\|hour_of_day\|get_hourly_page_views" src/components/dashboard/RestaurantAnalytics.tsx
```

**Report back:**
1. Exact line range of the hour heatmap block (from its section header/card to its closing `</div>`)
2. The data source — which state variable holds the 24 hours of data, how it's fetched, what shape it has
3. Existing tooltip / hover behavior (if any)
4. Any helper functions used (e.g. `getHeatmapColor(value)`)

**Stop after reporting. Wait for confirmation before Step 2.**

### Step 2 — Implement bar chart replacement

After I confirm Step 1, replace the heatmap with a bar chart using this reference code (adapt to project conventions — inline S.* styles, existing data state names, TR labels):

#### Bar chart spec

- **Container:** same card wrapper as current heatmap (do not change the card border, padding, title, or "Son 7 gün" period badge on the right)
- **Chart area:** 240px height, full card width minus padding
- **SVG viewBox:** `0 0 860 240`, `preserveAspectRatio="none"` so it stretches responsively
- **Margins:** top 20, right 20, bottom 32, left 36
- **Y axis:** 5 gridlines at 0, 25%, 50%, 75%, 100% of max value, with value labels on the left (`#9CA3AF` 11px). Gridline color `#F3F4F6`.
- **X axis:** 24 bars evenly spaced. Hour labels under every 3rd hour (00, 03, 06, 09, 12, 15, 18, 21) plus the peak hour. Peak label in green (`#10B981`, bold), others `#6B7280`.
- **Bar:**
  - Width: 70% of the band (0.7 * bandWidth)
  - Rounded top corners: `rx="3"`
  - Fill: peak hour `#10B981`, others `#86EFAC`
  - Zero values: do not render (opacity 0)
- **Peak hour detection:** `hours.reduce((a, b) => b.value > a.value ? b : a).hour` — first bar with max value
- **Tooltip:** absolute-positioned div, shown on hover, format: `{HH}:00 — {count} görüntülenme`. Dark background `#1C1C1E`, white text, 12px, 6x10 padding, 6px radius, small arrow below. Follows mouse position.

#### Reference implementation (adapt; do not copy verbatim if project uses different patterns)

```tsx
{/* Saat Bazlı Yoğunluk */}
<div style={S.card}>
  <div style={S.cardHead}>
    <h2 style={S.cardTitle}>Saat Bazlı Yoğunluk</h2>
    <span style={S.cardPeriod}>Son {dateRange} gün</span>
  </div>
  <HourlyBarChart data={hourlyData} />
</div>

// --- Component ---

function HourlyBarChart({ data }: { data: { hour: number; count: number }[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Ensure we always have 24 hours (fill missing with 0)
  const hours = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h);
    return { hour: h, count: found ? found.count : 0 };
  });

  const maxV = Math.max(1, ...hours.map(d => d.count));
  const peakHour = hours.reduce((a, b) => b.count > a.count ? b : a).hour;

  const W = 860, H = 240;
  const M = { top: 20, right: 20, bottom: 32, left: 36 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const band = innerW / 24;
  const barW = band * 0.7;
  const barX = (i: number) => i * band + band * 0.15;
  const centerX = (i: number) => i * band + band / 2;
  const yScale = (v: number) => innerH - (v / maxV) * innerH;

  const yTicks = [0, 1, 2, 3, 4].map(i => ({
    y: (innerH / 4) * i,
    value: Math.round(maxV - (maxV / 4) * i),
  }));

  const handleHover = (e: React.MouseEvent, d: { hour: number; count: number }) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 36,
      text: `${String(d.hour).padStart(2, '0')}:00 — ${d.count} görüntülenme`,
    });
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: 240 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
        <g transform={`translate(${M.left},${M.top})`}>
          {yTicks.map(t => (
            <g key={t.y}>
              <line x1={0} y1={t.y} x2={innerW} y2={t.y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={-8} y={t.y + 4} textAnchor="end" style={{ fontSize: 11, fill: '#9CA3AF' }}>{t.value}</text>
            </g>
          ))}

          {hours.map((d, i) => {
            if (d.count === 0) return null;
            const h = innerH - yScale(d.count);
            const y = yScale(d.count);
            const fill = d.hour === peakHour ? '#10B981' : '#86EFAC';
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
                  fill: isPeak ? '#10B981' : '#6B7280',
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
        <div style={{
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
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
```

### Step 3 — Preserve surrounding context

- Do NOT change the card title ("Saat Bazlı Yoğunluk"), the "Son X gün" badge, or the card border/padding
- Do NOT change the data fetching logic (`useEffect` + `supabase.rpc('get_hourly_page_views', ...)`)
- Use the existing `hourlyData` (or equivalent) state variable — match the existing name from Step 1 report
- If the existing data shape differs from `{ hour: number; count: number }[]`, adapt the component's prop interface to match
- Keep TR labels: "Saat Bazlı Yoğunluk", "görüntülenme"
- Component can be defined in the same file (not a separate file) unless the file is already split into sub-components

### Step 4 — Build and verify

```bash
cd /opt/khp/tabbled
npm run build
```

Report:
- Lines removed (heatmap implementation)
- Lines added (bar chart implementation)
- Net line change
- Build output tail (last 5 lines)

### Step 5 — DO NOT push

Commit and push will be done by Murat after visual review.

---

## GENERAL RULES

1. Read before editing — send Step 1 report first, wait for confirmation
2. Do not refactor the surrounding file (no unrelated cleanups, no import reorgs)
3. Preserve the existing card wrapper exactly — only swap the chart body
4. Match project style: inline `style={...}` or `S.*` pattern (whichever is used in the file now)
5. No new npm packages. No new dependencies.
6. No `git commit`, no `git push`. Stop after build passes.

---

## TEST CHECKLIST

- [ ] Heatmap block removed
- [ ] Bar chart block added in same card
- [ ] Data source unchanged (still uses `get_hourly_page_views` RPC and existing state)
- [ ] Peak bar renders in darker green (#10B981)
- [ ] Non-peak bars render in lighter green (#86EFAC)
- [ ] Zero-value hours do not render visible bars
- [ ] Y axis has 5 gridlines with value labels
- [ ] X axis labels every 3rd hour + peak hour, peak label bold green
- [ ] Hover tooltip works with correct Turkish format
- [ ] Card title, period badge, and padding unchanged
- [ ] `npm run build` clean
