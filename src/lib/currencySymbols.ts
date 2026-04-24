import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// TRY is the implicit base and not present as a row in exchange_rates.
// Common ISO codes get a hardcoded fallback so admin UIs render sensibly
// even before the async DB fetch resolves.
const KNOWN: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  AED: 'د.إ',
  SAR: 'ر.س',
  CAD: 'C$',
  AUD: 'A$',
};

const cache: Record<string, string> = { ...KNOWN };
let fetched = false;
let inflight: Promise<void> | null = null;

export async function ensureCurrencySymbols(): Promise<void> {
  if (fetched) return;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase.from('exchange_rates').select('currency_code, symbol');
    if (data) {
      for (const r of data as { currency_code: string; symbol: string }[]) {
        if (r.symbol) cache[r.currency_code] = r.symbol;
      }
    }
    fetched = true;
    inflight = null;
  })();
  return inflight;
}

export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return '₺';
  return cache[code] || code;
}

/**
 * Returns the symbol for a base currency code. Starts with a synchronous
 * fallback (hardcoded common codes or the code itself), then updates once
 * the cached exchange_rates fetch resolves.
 */
export function useBaseCurrencySymbol(baseCurrency: string | null | undefined): string {
  const code = baseCurrency || 'TRY';
  const [sym, setSym] = useState(() => getCurrencySymbol(code));
  useEffect(() => {
    let cancelled = false;
    setSym(getCurrencySymbol(code));
    ensureCurrencySymbols().then(() => {
      if (!cancelled) setSym(getCurrencySymbol(code));
    });
    return () => { cancelled = true; };
  }, [code]);
  return sym;
}
