import { useEffect, useRef, useState } from 'react';
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import type { ExchangeRate } from '../hooks/useCurrency';
import type { MenuTheme } from '../lib/themes';

interface Props {
  available: ExchangeRate[];
  selected: string;
  onSelect: (code: string) => void;
  lang: 'tr' | 'en' | 'ar' | 'zh';
  theme: MenuTheme;
  variant?: 'splash' | 'header';
}

const STRINGS = {
  tr: { search: 'Para birimi ara…', label: 'Para Birimi' },
  en: { search: 'Search currency…', label: 'Currency' },
  ar: { search: 'ابحث عن عملة…', label: 'العملة' },
  zh: { search: '搜索货币…', label: '货币' },
};

export default function CurrencyDropdown({ available, selected, onSelect, lang, theme, variant = 'header' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const ui = STRINGS[lang] || STRINGS.en;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = available.find((c) => c.currency_code === selected) || available[0];
  const filter = query.trim().toLowerCase();
  const filtered = filter
    ? available.filter((c) => {
        const name = lang === 'tr' ? c.currency_name_tr : c.currency_name_en;
        return c.currency_code.toLowerCase().includes(filter) || name.toLowerCase().includes(filter);
      })
    : available;

  const isSplash = variant === 'splash';
  const btnBg = isSplash ? 'rgba(255,255,255,0.1)' : theme.categoryBg;
  const btnColor = isSplash ? 'rgba(255,255,255,0.9)' : theme.mutedText;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ui.label}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 6,
          backgroundColor: btnBg, color: btnColor,
          fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
          minHeight: 26,
        }}
      >
        <span>{current.symbol || current.currency_code}</span>
        <span style={{ fontWeight: 600 }}>{current.currency_code}</span>
        <CaretDown size={10} weight="bold" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 240,
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 12,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 8, borderBottom: `1px solid ${theme.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, backgroundColor: theme.categoryBg }}>
              <MagnifyingGlass size={12} weight="thin" style={{ color: theme.mutedText }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ui.search}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 12, color: theme.text, fontFamily: "'Roboto', sans-serif",
                }}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: theme.mutedText, textAlign: 'center' }}>—</div>
            ) : (
              filtered.map((c) => {
                const sel = c.currency_code === selected;
                const name = lang === 'tr' ? c.currency_name_tr : c.currency_name_en;
                return (
                  <button
                    key={c.currency_code}
                    type="button"
                    onClick={() => { onSelect(c.currency_code); setOpen(false); setQuery(''); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', border: 'none', cursor: 'pointer',
                      background: sel ? `${theme.accent}15` : 'transparent',
                      color: theme.text, textAlign: 'left',
                      fontSize: 12, fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{c.flag_emoji || '🏳'}</span>
                    <span style={{ fontWeight: 600, minWidth: 36 }}>{c.currency_code}</span>
                    <span style={{ flex: 1, color: theme.mutedText, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    {sel && <span style={{ fontSize: 10, color: theme.accent, fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
