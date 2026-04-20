// src/components/menu/FilterPanel.tsx
// Filter drawer bileşeni — kategori/diyet/alerjen filtreleme
// PublicMenu.tsx'ten çıkarıldı

import { XCircle } from '@phosphor-icons/react';
import type { LangCode } from '../../types/menu';
import type { MenuTheme } from '../../lib/themes';
import { toUiLang } from '../../lib/menuHelpers';
import { ALLERGEN_LIST } from '../../lib/allergens';
import { FILTER_STRINGS as FILTER_LABELS } from '../../lib/menuI18n';

export function FilterPanel({
  lang, theme, excludeAllergens, preferences,
  onToggleAllergen, onTogglePreference, onClearAll, onClose,
}: {
  lang: LangCode;
  theme: MenuTheme;
  excludeAllergens: string[];
  preferences: string[];
  onToggleAllergen: (key: string) => void;
  onTogglePreference: (key: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const fl = FILTER_LABELS[toUiLang(lang)];
  const headingFont = "'Roboto', sans-serif";
  const bodyFont = "'Roboto', sans-serif";
  const iconLang: 'tr' | 'en' = lang === 'tr' ? 'tr' : 'en';

  const prefChips: { key: string; label: string }[] = [
    { key: 'popular', label: fl.popular },
    { key: 'new', label: fl.new },
    { key: 'vegetarian', label: fl.vegetarian },
    { key: 'vegan', label: fl.vegan },
    { key: 'halal', label: fl.halal },
    { key: 'kosher', label: fl.kosher },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'modalBackdropIn 0.2s ease-out' }} />

      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: theme.modalBg, color: theme.text, fontFamily: bodyFont, animation: 'modalSlideUp 0.3s ease-out forwards' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 backdrop-blur-sm"
          style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.divider}` }}
        >
          <h2 className="text-lg" style={{ fontFamily: headingFont, fontWeight: 700, color: theme.text }}>
            {fl.filters}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ color: theme.mutedText, fontWeight: 500 }}
            >
              {fl.clearAll}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.badgeBg, color: theme.text }}
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Free From (14 EU Allergens) */}
          <div>
            <h3
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: theme.mutedText, fontWeight: 600 }}
            >
              {fl.freeFrom}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_LIST.map((allergen) => {
                const label = iconLang === 'tr' ? allergen.name_tr : allergen.name_en;
                const selected = excludeAllergens.includes(allergen.key);
                return (
                  <button
                    key={allergen.key}
                    onClick={() => onToggleAllergen(allergen.key)}
                    className="inline-flex items-center px-3 rounded-full text-xs transition-all"
                    style={{
                      minHeight: 36,
                      backgroundColor: selected ? '#fdf2f8' : theme.categoryBg,
                      color: selected ? '#FF4F7A' : theme.text,
                      border: `1px solid ${selected ? '#FF4F7A' : theme.cardBorder}`,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences (Diet + Popular/New) */}
          <div>
            <h3
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: theme.mutedText, fontWeight: 600 }}
            >
              {fl.preferences}
            </h3>
            <div className="flex flex-wrap gap-2">
              {prefChips.map(({ key, label }) => {
                const selected = preferences.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => onTogglePreference(key)}
                    className="inline-flex items-center px-4 rounded-full text-xs transition-all"
                    style={{
                      minHeight: 36,
                      backgroundColor: selected ? '#fdf2f8' : theme.categoryBg,
                      color: selected ? '#FF4F7A' : theme.text,
                      border: `1px solid ${selected ? '#FF4F7A' : theme.cardBorder}`,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply */}
        <div
          className="sticky bottom-0 p-4 backdrop-blur-sm"
          style={{ backgroundColor: theme.cardBg, borderTop: `1px solid ${theme.divider}` }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full text-sm shadow-lg transition-all"
            style={{
              backgroundColor: theme.accent,
              color: theme.key === 'white' ? '#FFFFFF' : theme.bg,
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            {fl.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
