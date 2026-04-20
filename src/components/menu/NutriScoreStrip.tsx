// src/components/menu/NutriScoreStrip.tsx
// Detay modalında kullanılan 5 harfli kompakt Nutri-Score stripi
// Seçili harf büyük + halo'lu, diğerleri solgun
// PublicMenu.tsx'ten çıkarıldı

import {
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_LABELS,
  nutriScoreTextColor,
  type NutriScore,
} from '../../lib/nutritionEU';
import type { LangCode } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';

export function NutriScoreStrip({
  score,
  lang,
  theme,
}: {
  score: NutriScore;
  lang: LangCode;
  theme: MenuTheme;
}) {
  const uiLang = toUiLang(lang);
  const labelObj = NUTRI_SCORE_LABELS[score];
  const localized = (o: { tr: string; en: string; ar: string; zh: string }) => o[uiLang] ?? o.en;
  const allScores: NutriScore[] = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.text,
          marginBottom: 8,
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        Nutri-Score
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
        role="img"
        aria-label={`Nutri-Score ${score}: ${localized(labelObj)}`}
      >
        {allScores.map((s) => {
          const isSelected = s === score;
          const baseColor = NUTRI_SCORE_COLORS[s];
          const textColor = nutriScoreTextColor(s);

          return (
            <div
              key={s}
              style={{
                width: isSelected ? 42 : 32,
                height: isSelected ? 42 : 32,
                background: baseColor,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: isSelected ? 900 : 700,
                fontSize: isSelected ? 22 : 16,
                borderRadius: isSelected ? 6 : 4,
                opacity: isSelected ? 1 : 0.35,
                boxShadow: isSelected
                  ? `0 0 0 2px ${theme.cardBg}, 0 0 0 4px ${baseColor}`
                  : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                lineHeight: 1,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 12,
          color: theme.mutedText,
          marginTop: 8,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 300,
        }}
      >
        {localized(labelObj)}
      </div>
    </div>
  );
}
