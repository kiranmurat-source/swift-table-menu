import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ExchangeRate {
  currency_code: string;
  currency_name_tr: string;
  currency_name_en: string;
  rate: number;
  unit: number;
  flag_emoji: string | null;
  symbol: string;
  updated_at: string;
}

export const TRY_OPTION: ExchangeRate = {
  currency_code: 'TRY',
  currency_name_tr: 'Türk Lirası',
  currency_name_en: 'Turkish Lira',
  rate: 1,
  unit: 1,
  flag_emoji: '🇹🇷',
  symbol: '₺',
  updated_at: '',
};

const STORAGE_KEY = 'tabbled_currency';

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'TRY';
  } catch {
    return 'TRY';
  }
}

export function useCurrency(enabled: boolean) {
  const [rates, setRates] = useState<Record<string, ExchangeRate>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string>(() => (enabled ? readStored() : 'TRY'));

  useEffect(() => {
    if (!enabled) {
      setRates({});
      setLoaded(true);
      setSelected('TRY');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('exchange_rates').select('*');
      if (cancelled) return;
      if (error || !data) {
        setRates({});
      } else {
        const map: Record<string, ExchangeRate> = {};
        for (const r of data as ExchangeRate[]) {
          map[r.currency_code] = { ...r, rate: Number(r.rate) };
        }
        setRates(map);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const setCurrency = useCallback((code: string) => {
    setSelected(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  }, []);

  const available = useMemo<ExchangeRate[]>(() => {
    if (!enabled) return [TRY_OPTION];
    const others = Object.values(rates).sort((a, b) => a.currency_code.localeCompare(b.currency_code));
    return [TRY_OPTION, ...others];
  }, [enabled, rates]);

  const selectedRate: ExchangeRate = useMemo(() => {
    if (selected === 'TRY') return TRY_OPTION;
    return rates[selected] || TRY_OPTION;
  }, [selected, rates]);

  // Whether the dropdown should show: feature on AND we have at least one non-TRY rate
  const visible = enabled && Object.keys(rates).length > 0;

  // If feature on but selected currency disappears (rate not loaded), fall back to TRY for display
  const effective = selectedRate.currency_code;

  const convert = useCallback((amountTl: number): number => {
    if (effective === 'TRY' || selectedRate.rate <= 0) return amountTl;
    return amountTl / selectedRate.rate;
  }, [effective, selectedRate.rate]);

  const format = useCallback((amountTl: number | null | undefined): string => {
    const n = Number(amountTl ?? 0);
    if (effective === 'TRY' || selectedRate.rate <= 0) {
      // TR formatı: 1.234,56 ₺
      return `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
    }
    const conv = n / selectedRate.rate;
    const formatted = conv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${selectedRate.symbol}${formatted}`;
  }, [effective, selectedRate]);

  // TL formatter (used for WhatsApp messages — always TL)
  const formatTl = useCallback((amountTl: number | null | undefined): string => {
    const n = Number(amountTl ?? 0);
    return `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  }, []);

  return {
    rates,
    available,
    selected: effective,
    setCurrency,
    visible,
    loaded,
    selectedRate,
    convert,
    format,
    formatTl,
    isTry: effective === 'TRY',
  };
}

export type UseCurrencyReturn = ReturnType<typeof useCurrency>;
