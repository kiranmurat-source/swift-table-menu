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
  /** True when this option is the restaurant's operational base currency. UI highlight. */
  isBase?: boolean;
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

function readStored(fallback: string): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function useCurrency(enabled: boolean, baseCurrency: string = 'TRY') {
  const [rates, setRates] = useState<Record<string, ExchangeRate>>({});
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string>(() => (enabled ? readStored(baseCurrency) : baseCurrency));

  useEffect(() => {
    if (!enabled) {
      setRates({});
      setLoaded(true);
      setSelected(baseCurrency);
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
  }, [enabled, baseCurrency]);

  const setCurrency = useCallback((code: string) => {
    setSelected(code);
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  }, []);

  // Synthetic option representing the base currency, whether TRY (implicit)
  // or a foreign code loaded from exchange_rates. Carries isBase=true.
  const baseOption: ExchangeRate = useMemo(() => {
    if (baseCurrency === 'TRY') return { ...TRY_OPTION, isBase: true };
    const r = rates[baseCurrency];
    if (r) return { ...r, isBase: true };
    // rates not yet loaded — synthetic stub so selectedRate/format don't crash
    return {
      currency_code: baseCurrency,
      currency_name_tr: baseCurrency,
      currency_name_en: baseCurrency,
      rate: 1,
      unit: 1,
      flag_emoji: null,
      symbol: baseCurrency,
      updated_at: '',
      isBase: true,
    };
  }, [baseCurrency, rates]);

  const available = useMemo<ExchangeRate[]>(() => {
    if (!enabled) return [baseOption];
    const list: ExchangeRate[] = [baseOption];
    // TRY next if base isn't TRY
    if (baseCurrency !== 'TRY') list.push(TRY_OPTION);
    // Everything else alphabetical, excluding the base
    const others = Object.values(rates)
      .filter(r => r.currency_code !== baseCurrency)
      .sort((a, b) => a.currency_code.localeCompare(b.currency_code));
    list.push(...others);
    return list;
  }, [enabled, rates, baseCurrency, baseOption]);

  const selectedRate: ExchangeRate = useMemo(() => {
    if (selected === baseCurrency) return baseOption;
    if (selected === 'TRY') return TRY_OPTION;
    return rates[selected] || baseOption;
  }, [selected, rates, baseCurrency, baseOption]);

  // Dropdown visibility: feature on AND rates have loaded (at least one non-base entry).
  const visible = enabled && Object.keys(rates).length > 0;

  const effective = selectedRate.currency_code;

  // Pivot-through-TRY conversion. Rates in `rates` are TRY-per-foreign-unit.
  // amountInBase → TRY → display:
  //   amount_in_base * (TRY-per-base) / (TRY-per-display) = amount_in_display
  const convert = useCallback((amountInBase: number): number => {
    if (effective === baseCurrency || amountInBase === 0) return amountInBase;

    const baseRateInTry = baseCurrency === 'TRY' ? 1 : (rates[baseCurrency]?.rate ?? 1);
    const displayRateInTry = effective === 'TRY' ? 1 : (rates[effective]?.rate ?? 1);

    if (displayRateInTry <= 0) return amountInBase;

    return (amountInBase * baseRateInTry) / displayRateInTry;
  }, [effective, baseCurrency, rates]);

  // Unified format: suffix symbol, tr-TR locale. Examples:
  //   1.234,56 ₺   27,49 $   91,55 د.إ
  const format = useCallback((amountInBase: number | null | undefined): string => {
    const n = Number(amountInBase ?? 0);
    const converted = convert(n);
    const symbol = selectedRate.symbol || effective;
    const formatted = converted.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${symbol}`;
  }, [convert, selectedRate.symbol, effective]);

  // Always formats in the restaurant's base currency, ignoring customer's
  // display selection. Used for WhatsApp messages / cart internals that
  // must carry the operational currency.
  const formatBase = useCallback((amountInBase: number | null | undefined): string => {
    const n = Number(amountInBase ?? 0);
    const baseSymbol = baseCurrency === 'TRY'
      ? '₺'
      : (rates[baseCurrency]?.symbol ?? baseCurrency);
    const formatted = n.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${baseSymbol}`;
  }, [baseCurrency, rates]);

  const isBase = effective === baseCurrency;

  return {
    rates,
    available,
    selected: effective,
    setCurrency,
    visible,
    loaded,
    selectedRate,
    baseCurrency,
    convert,
    format,
    formatBase,
    /** @deprecated use formatBase */
    formatTl: formatBase,
    isBase,
    /** @deprecated use isBase */
    isTry: effective === 'TRY',
  };
}

export type UseCurrencyReturn = ReturnType<typeof useCurrency>;
