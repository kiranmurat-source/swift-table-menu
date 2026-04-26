// src/components/menu/NutritionFactsTable.tsx
// AB uyumlu besin değerleri tablosu (Enerji kJ+kcal, trafik ışığı dot'ları, RI%)
// PublicMenu.tsx'ten çıkarıldı

import type { LangCode, Nutrition } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';
import { NUTRITION_STRINGS as UI_STRINGS } from '../../lib/menuI18n';
import {
  kcalToKj,
  sodiumToSalt,
  getRIPercent,
  getTrafficLight,
  TRAFFIC_LIGHT_COLORS,
  formatNutritionValue,
} from '../../lib/nutritionEU';

export function NutritionFactsTable({
  nutrition,
  lang,
  theme,
  bare = false,
}: {
  nutrition: Nutrition;
  lang: LangCode;
  theme: MenuTheme;
  bare?: boolean;
}) {
  const headingFont = "'Roboto', sans-serif";
  const uiLang = toUiLang(lang);
  const fmt = (v: number | null) => (v == null ? null : formatNutritionValue(v, uiLang));

  // Parse serving size as number if it's like "150g"
  const servingG = (() => {
    if (!nutrition.serving_size) return null;
    const m = String(nutrition.serving_size).match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  // Source values are treated as per-100g.
  const kcal = nutrition.calories ?? null;
  const kJ = kcal != null ? kcalToKj(kcal) : null;
  const fat = nutrition.total_fat ?? null;
  const sat = nutrition.saturated_fat ?? null;
  const carbs = nutrition.total_carb ?? null;
  const sugars = nutrition.sugars ?? null;
  const protein = nutrition.protein ?? null;
  const salt = nutrition.sodium != null ? sodiumToSalt(nutrition.sodium) : null;

  const perServing = (v: number | null): number | null => {
    if (v == null || servingG == null) return null;
    return Number(((v * servingG) / 100).toFixed(1));
  };

  const tlColor = (tl: ReturnType<typeof getTrafficLight>) => (tl ? TRAFFIC_LIGHT_COLORS[tl] : null);

  type RowDef = {
    label: string;
    value: number | null;
    unit: string;
    indent?: boolean;
    bold?: boolean;
    ri: number | null;
    tl?: string | null;
    /** Enerji için özel gösterim: "523 kJ / 125 kcal" */
    customDisplay?: string;
  };

  const rows: RowDef[] = [
    {
      label: UI_STRINGS.energy[uiLang],
      value: kcal,
      unit: 'kcal',
      bold: true,
      ri: getRIPercent('energyKcal', kcal),
      customDisplay: kcal != null && kJ != null ? `${kJ} kJ / ${fmt(kcal)} kcal` : undefined,
    },
    { label: UI_STRINGS.fat[uiLang], value: fat, unit: 'g', bold: true, ri: getRIPercent('fat', fat), tl: tlColor(getTrafficLight('fat', fat)) },
    { label: UI_STRINGS.saturates[uiLang], value: sat, unit: 'g', indent: true, ri: getRIPercent('saturatedFat', sat), tl: tlColor(getTrafficLight('saturatedFat', sat)) },
    { label: UI_STRINGS.carbs[uiLang], value: carbs, unit: 'g', bold: true, ri: getRIPercent('carbohydrate', carbs) },
    { label: UI_STRINGS.ofWhichSugars[uiLang], value: sugars, unit: 'g', indent: true, ri: getRIPercent('sugars', sugars), tl: tlColor(getTrafficLight('sugars', sugars)) },
    { label: UI_STRINGS.protein[uiLang], value: protein, unit: 'g', bold: true, ri: getRIPercent('protein', protein) },
    { label: UI_STRINGS.salt[uiLang], value: salt, unit: 'g', bold: true, ri: getRIPercent('salt', salt), tl: tlColor(getTrafficLight('salt', salt)) },
  ];

  const visibleRows = rows.filter(r => r.value != null);
  if (visibleRows.length === 0) return null;

  const showPerServing = servingG != null;

  const body = (
    <>
      {/* Column headers */}
      <div
        className={bare ? 'grid pb-2 text-xs' : 'grid mt-3 pb-2 text-xs'}
        style={{
          gridTemplateColumns: showPerServing ? '1.4fr 1fr 1fr 0.6fr' : '1.6fr 1fr 0.6fr',
          gap: 8,
          borderBottom: `1px solid ${theme.divider}`,
          color: theme.mutedText,
          fontWeight: 500,
        }}
      >
        <span />
        <span style={{ textAlign: 'right' }}>{UI_STRINGS.per100g[uiLang]}</span>
        {showPerServing && (
          <span style={{ textAlign: 'right' }}>
            {UI_STRINGS.perServing[uiLang]} ({servingG}g)
          </span>
        )}
        <span style={{ textAlign: 'right' }}>RI%</span>
      </div>

      {/* Rows */}
      {visibleRows.map((r) => {
        const ps = perServing(r.value);
        const psStr = ps != null ? formatNutritionValue(ps, uiLang) : null;
        const valStr = r.value != null ? formatNutritionValue(r.value, uiLang) : null;
        return (
          <div
            key={r.label}
            className="grid items-center py-1.5 text-sm tabular-nums"
            style={{
              gridTemplateColumns: showPerServing ? '1.4fr 1fr 1fr 0.6fr' : '1.6fr 1fr 0.6fr',
              gap: 8,
              color: theme.text,
              fontWeight: r.bold ? 700 : 400,
              paddingLeft: r.indent ? 12 : 0,
            }}
          >
            <span className="flex items-center gap-2">
              {r.tl && (
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: '50%', background: r.tl, flexShrink: 0 }}
                />
              )}
              <span>{r.indent ? `— ${r.label}` : r.label}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              {r.customDisplay ?? (valStr != null ? `${valStr} ${r.unit}` : '—')}
            </span>
            {showPerServing && (
              <span style={{ textAlign: 'right' }}>
                {psStr != null ? `${psStr} ${r.unit}` : '—'}
              </span>
            )}
            <span style={{ textAlign: 'right', color: theme.mutedText, fontWeight: 400 }}>
              {r.ri != null ? `${r.ri}%` : '—'}
            </span>
          </div>
        );
      })}

      <p className="text-[11px] mt-3" style={{ color: theme.mutedText, fontWeight: 300 }}>
        {UI_STRINGS.referenceIntakeNote[uiLang]}
      </p>
    </>
  );

  if (bare) return body;

  return (
    <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${theme.divider}` }}>
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      >
        <h3 className="text-base" style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}>
          {UI_STRINGS.nutritionTitle[uiLang]}
        </h3>
        {body}
      </div>
    </div>
  );
}
