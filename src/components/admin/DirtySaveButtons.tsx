import { useDirtySave } from '@/contexts/DirtySaveContext';
import type { AdminTheme } from '@/lib/adminTheme';

export function DirtySaveButtons({ theme }: { theme: AdminTheme }) {
  const { isDirty, saving, triggerSave, requestCancel, saveLabel } = useDirtySave();

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginLeft: 4,
        opacity: isDirty ? 1 : 0,
        transform: isDirty ? 'translateX(0)' : 'translateX(8px)',
        pointerEvents: isDirty ? 'auto' : 'none',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}
      aria-hidden={!isDirty}
    >
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
          padding: '6px 14px',
          borderRadius: 8,
          border: 'none',
          background: theme.accent,
          color: '#fff',
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
  );
}
