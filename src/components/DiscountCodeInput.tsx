import { useState } from 'react';
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { supabase } from '../lib/supabase';
import type { MenuTheme } from '../lib/themes';
import type { AppliedDiscount } from '../lib/useCart';

export interface DiscountUIStrings {
  enterDiscountCode: string;
  apply: string;
  invalidCode: string;
  codeExpired: string;
  codeInactive: string;
  codeNotYetActive: string;
  codeLimitReached: string;
  minOrderRequired: string;
  percentOff: string;
  discountApplied: string;
}

interface Props {
  restaurantId: string;
  subtotal: number;
  appliedDiscount: AppliedDiscount | null;
  onApply: (discount: AppliedDiscount) => void;
  onRemove: () => void;
  theme: MenuTheme;
  ui: DiscountUIStrings;
  currency: string;
}

export default function DiscountCodeInput({
  restaurantId, subtotal, appliedDiscount, onApply, onRemove,
  theme, ui, currency,
}: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || loading) return;

    // Already applied same code
    if (appliedDiscount && appliedDiscount.code === trimmed) return;

    setError('');
    setLoading(true);

    const { data, error: fetchErr } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .ilike('code', trimmed)
      .eq('is_active', true)
      .single();

    if (fetchErr || !data) {
      setError(ui.invalidCode);
      setLoading(false);
      return;
    }

    const now = new Date();

    if (data.starts_at && new Date(data.starts_at) > now) {
      setError(ui.codeNotYetActive);
      setLoading(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < now) {
      setError(ui.codeExpired);
      setLoading(false);
      return;
    }

    if (data.max_uses !== null && data.current_uses >= data.max_uses) {
      setError(ui.codeLimitReached);
      setLoading(false);
      return;
    }

    const minAmount = Number(data.min_order_amount) || 0;
    if (minAmount > 0 && subtotal < minAmount) {
      setError(`${ui.minOrderRequired} ${minAmount.toFixed(2)} ${currency}`);
      setLoading(false);
      return;
    }

    onApply({
      code: data.code,
      type: data.discount_type as 'percentage' | 'fixed',
      value: Number(data.discount_value),
      minOrderAmount: minAmount,
    });
    setCode('');
    setLoading(false);
  };

  if (appliedDiscount) {
    const label = appliedDiscount.type === 'percentage'
      ? `%${appliedDiscount.value} ${ui.percentOff}`
      : `${appliedDiscount.value.toFixed(2)} ${currency} ${ui.percentOff}`;

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 8,
        backgroundColor: theme.key === 'black' ? '#14532d' : '#f0fdf4',
        border: '1px solid #86efac', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={16} style={{ color: '#22c55e' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.key === 'black' ? '#86efac' : '#15803d' }}>
            {appliedDiscount.code}
          </span>
          <span style={{ fontSize: 11, color: theme.key === 'black' ? '#bbf7d0' : '#166534' }}>
            — {label} {ui.discountApplied}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.key === 'black' ? '#86efac' : '#15803d', padding: 2 }}
        >
          <XCircle size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          placeholder={ui.enterDiscountCode}
          maxLength={20}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: `1px solid ${error ? '#dc2626' : theme.cardBorder}`,
            backgroundColor: theme.cardBg, color: theme.text,
            fontSize: 13, fontFamily: "'Inter', sans-serif",
            outline: 'none', letterSpacing: '0.05em',
          }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || loading}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            backgroundColor: !code.trim() ? theme.mutedText : '#FF4F7A',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: !code.trim() ? 'not-allowed' : 'pointer',
            opacity: !code.trim() ? 0.5 : 1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {loading ? '...' : ui.apply}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4, paddingLeft: 4 }}>{error}</p>
      )}
    </div>
  );
}
