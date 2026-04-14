import type { MenuTheme } from '../lib/themes';

interface Props {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  theme: MenuTheme;
}

export default function QuantitySelector({ quantity, onIncrement, onDecrement, size = 'md', theme }: Props) {
  const h = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? 12 : 14;
  const btnW = size === 'sm' ? 28 : 36;
  const accent = '#FF4F7A';
  const bg = theme.key === 'black' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: h / 2,
        backgroundColor: bg,
        height: h,
        overflow: 'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onDecrement}
        style={{
          width: btnW,
          height: h,
          border: 'none',
          background: 'none',
          color: accent,
          fontSize: fontSize + 2,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        −
      </button>
      <span
        style={{
          minWidth: size === 'sm' ? 20 : 24,
          textAlign: 'center',
          fontSize,
          fontWeight: 700,
          color: theme.text,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        style={{
          width: btnW,
          height: h,
          border: 'none',
          background: 'none',
          color: accent,
          fontSize: fontSize + 2,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        +
      </button>
    </div>
  );
}
