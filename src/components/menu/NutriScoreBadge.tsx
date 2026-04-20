// src/components/menu/NutriScoreBadge.tsx
// Ürün kartlarında kullanılan tek harf Nutri-Score badge
// Tıklanınca 5 harfli dropdown açar
// PublicMenu.tsx'ten çıkarıldı

import { useState, useRef } from 'react';
import {
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_LABELS,
  NUTRI_SCORE_VALUES,
  nutriScoreTextColor,
  type NutriScore,
} from '../../lib/nutritionEU';
import type { LangCode } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';
import { NUTRI_SCORE_STRINGS as UI_STRINGS } from '../../lib/menuI18n';

export function NutriScoreBadge({
  score,
  lang,
  theme,
  size = 20,
}: {
  score: NutriScore;
  lang: LangCode;
  theme: MenuTheme;
  size?: number;
}) {
  const uiLang = toUiLang(lang);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isDark = theme.cardBg !== '#FFFFFF';
  const dropdownBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const dropdownBorder = isDark ? '#3C3C3E' : '#E5E5E5';
  const shadow = isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)';
  const labelObj = NUTRI_SCORE_LABELS[score];
  const localized = (o: { tr: string; en: string; ar: string; zh: string }) => o[uiLang] ?? o.en;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`Nutri-Score ${score}`}
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          background: NUTRI_SCORE_COLORS[score],
          color: nutriScoreTextColor(score),
          border: 'none',
          padding: 0,
          fontWeight: 700,
          fontSize: Math.round(size * 0.6),
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }}
      >
        {score}
      </button>
      {open && (
        <>
          <div
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'transparent' }}
          />
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: 240,
              background: dropdownBg,
              border: `1px solid ${dropdownBorder}`,
              borderRadius: 12,
              boxShadow: shadow,
              padding: 12,
              zIndex: 999,
              animation: 'nutriScoreIn 0.2s ease',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{UI_STRINGS.nutriScoreTitle[uiLang]}</div>
            <div style={{ fontSize: 11, color: theme.mutedText, marginTop: 2 }}>
              {UI_STRINGS.nutriScoreDesc[uiLang]}
            </div>

            {/* Skala */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 10 }}>
              {NUTRI_SCORE_VALUES.map((s) => {
                const selected = s === score;
                const bg = NUTRI_SCORE_COLORS[s];
                return (
                  <div
                    key={s}
                    style={{
                      flex: selected ? 1.6 : 1,
                      height: selected ? 32 : 24,
                      borderRadius: selected ? 7 : 5,
                      background: selected ? bg : `${bg}40`,
                      color: selected ? nutriScoreTextColor(s) : theme.text,
                      border: `${selected ? 2 : 1}px solid ${selected ? bg : `${bg}4D`}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: selected ? 16 : 11,
                      boxShadow: selected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {s}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.mutedText, marginTop: 4 }}>
              <span>{UI_STRINGS.nutriScoreHealthier[uiLang]}</span>
              <span>{UI_STRINGS.nutriScoreLessHealthy[uiLang]}</span>
            </div>

            {/* Seçili skor açıklaması */}
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                background: `${NUTRI_SCORE_COLORS[score]}1F`,
                border: `1px solid ${NUTRI_SCORE_COLORS[score]}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: NUTRI_SCORE_COLORS[score],
                  color: nutriScoreTextColor(score),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.3 }}>
                {localized(labelObj)}
              </div>
            </div>

            <div style={{ fontSize: 10, color: theme.mutedText, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${dropdownBorder}` }}>
              {UI_STRINGS.nutriScoreDeclared[uiLang]}
            </div>
          </div>
        </>
      )}
    </>
  );
}
