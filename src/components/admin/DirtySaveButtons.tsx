import { useDirtySave } from '@/contexts/DirtySaveContext';
import type { AdminTheme } from '@/lib/adminTheme';

export function DirtySaveButtons({ theme }: { theme: AdminTheme }) {
  const { isDirty, saving, triggerSave, requestCancel, saveLabel } = useDirtySave();

  return (
    <div
      role="region"
      aria-label="Kaydedilmemiş değişiklikler"
      aria-live="polite"
      aria-hidden={!isDirty}
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        transform: isDirty ? 'translateY(0)' : 'translateY(16px)',
        opacity: isDirty ? 1 : 0,
        pointerEvents: isDirty ? 'auto' : 'none',
        transition: 'opacity 200ms ease, transform 200ms ease',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 14px 10px 18px',
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 12,
        boxShadow:
          theme.key === 'dark'
            ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35)'
            : '0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
        fontFamily: "'Roboto', sans-serif",
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.value,
          whiteSpace: 'nowrap',
        }}
      >
        Kaydedilmemiş değişiklikler
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={requestCancel}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.value,
            fontSize: 13,
            fontWeight: 500,
            cursor: !isDirty || saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={triggerSave}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            border: 'none',
            background: theme.accent,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: !isDirty || saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Roboto', sans-serif",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '...' : saveLabel}
        </button>
      </div>
    </div>
  );
}
