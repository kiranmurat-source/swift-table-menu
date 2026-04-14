import { ShoppingCart } from "@phosphor-icons/react";
import type { MenuTheme } from '../lib/themes';

interface Props {
  totalItems: number;
  totalAmount: number;
  onOpen: () => void;
  theme: MenuTheme;
  label: string;
  itemsLabel: string;
}

export default function CartBottomBar({ totalItems, totalAmount, onOpen, theme, label, itemsLabel }: Props) {
  if (totalItems === 0) return null;

  const bg = '#FF4F7A';

  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 56,
        backgroundColor: bg,
        color: '#fff',
        border: 'none',
        borderRadius: '16px 16px 0 0',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        animation: 'cartBarSlideUp 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShoppingCart size={20} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: 'rgba(255,255,255,0.25)',
            borderRadius: 10,
            padding: '2px 8px',
          }}
        >
          {totalItems} {itemsLabel}
        </span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700 }}>
        {totalAmount.toFixed(2)} ₺
      </span>
    </button>
  );
}
