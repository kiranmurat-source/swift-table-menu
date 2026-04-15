// fetch-exchange-rates
// TCMB günlük döviz kurlarını XML'den çeker, exchange_rates tablosuna upsert eder.
// Deploy: supabase functions deploy fetch-exchange-rates --project-ref qmnrawqvkwehufebbkxp --no-verify-jwt
// Trigger: cron (10:00, hafta içi) — curl -X POST https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/fetch-exchange-rates

// @ts-ignore - Deno remote import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

declare const Deno: { env: { get(key: string): string | undefined } };

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

interface CurrencyMeta {
  name_tr: string;
  name_en: string;
  symbol: string;
  flag: string;
}

const CURRENCY_META: Record<string, CurrencyMeta> = {
  USD: { name_tr: 'ABD Doları',         name_en: 'US Dollar',         symbol: '$',   flag: '🇺🇸' },
  EUR: { name_tr: 'Euro',                name_en: 'Euro',              symbol: '€',   flag: '🇪🇺' },
  GBP: { name_tr: 'İngiliz Sterlini',    name_en: 'British Pound',     symbol: '£',   flag: '🇬🇧' },
  CHF: { name_tr: 'İsviçre Frangı',      name_en: 'Swiss Franc',       symbol: 'CHF', flag: '🇨🇭' },
  JPY: { name_tr: 'Japon Yeni',          name_en: 'Japanese Yen',      symbol: '¥',   flag: '🇯🇵' },
  CAD: { name_tr: 'Kanada Doları',       name_en: 'Canadian Dollar',   symbol: 'C$',  flag: '🇨🇦' },
  AUD: { name_tr: 'Avustralya Doları',   name_en: 'Australian Dollar', symbol: 'A$',  flag: '🇦🇺' },
  DKK: { name_tr: 'Danimarka Kronu',     name_en: 'Danish Krone',      symbol: 'kr',  flag: '🇩🇰' },
  SEK: { name_tr: 'İsveç Kronu',         name_en: 'Swedish Krona',     symbol: 'kr',  flag: '🇸🇪' },
  NOK: { name_tr: 'Norveç Kronu',        name_en: 'Norwegian Krone',   symbol: 'kr',  flag: '🇳🇴' },
  SAR: { name_tr: 'Suudi Riyali',        name_en: 'Saudi Riyal',       symbol: '﷼',  flag: '🇸🇦' },
  KWD: { name_tr: 'Kuveyt Dinarı',       name_en: 'Kuwaiti Dinar',     symbol: 'د.ك', flag: '🇰🇼' },
  RUB: { name_tr: 'Rus Rublesi',         name_en: 'Russian Ruble',     symbol: '₽',   flag: '🇷🇺' },
  CNY: { name_tr: 'Çin Yuanı',           name_en: 'Chinese Yuan',      symbol: '¥',   flag: '🇨🇳' },
  BGN: { name_tr: 'Bulgar Levası',       name_en: 'Bulgarian Lev',     symbol: 'лв',  flag: '🇧🇬' },
  RON: { name_tr: 'Rumen Leyi',          name_en: 'Romanian Leu',      symbol: 'lei', flag: '🇷🇴' },
  IRR: { name_tr: 'İran Riyali',         name_en: 'Iranian Rial',      symbol: '﷼',  flag: '🇮🇷' },
  PKR: { name_tr: 'Pakistan Rupisi',     name_en: 'Pakistani Rupee',   symbol: '₨',   flag: '🇵🇰' },
  QAR: { name_tr: 'Katar Riyali',        name_en: 'Qatari Riyal',      symbol: '﷼',  flag: '🇶🇦' },
  KRW: { name_tr: 'Güney Kore Wonu',     name_en: 'South Korean Won',  symbol: '₩',   flag: '🇰🇷' },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ParsedRate {
  code: string;
  unit: number;
  forexSelling: number;
}

function parseTcmbXml(xml: string): ParsedRate[] {
  const out: ParsedRate[] = [];
  const blockRe = /<Currency[^>]*CurrencyCode="([A-Z]+)"[^>]*>([\s\S]*?)<\/Currency>/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(xml)) !== null) {
    const code = m[1];
    const block = m[2];
    const unitMatch = block.match(/<Unit>([^<]+)<\/Unit>/);
    const fxMatch = block.match(/<ForexSelling>([^<]*)<\/ForexSelling>/);
    if (!fxMatch || !fxMatch[1].trim()) continue;
    const fx = parseFloat(fxMatch[1].trim());
    if (!isFinite(fx) || fx <= 0) continue;
    const unit = unitMatch ? parseInt(unitMatch[1].trim(), 10) || 1 : 1;
    out.push({ code, unit, forexSelling: fx });
  }
  return out;
}

// @ts-ignore - Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing env vars' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const res = await fetch(TCMB_URL, { headers: { 'User-Agent': 'tabbled-fetch-rates/1.0' } });
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `TCMB fetch failed: ${res.status}` }),
        { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const xml = await res.text();
    const rates = parseTcmbXml(xml);
    if (rates.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No rates parsed (TCMB may be unavailable / weekend)' }),
        { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const rows = rates
      .filter((r) => CURRENCY_META[r.code])
      .map((r) => {
        const meta = CURRENCY_META[r.code];
        return {
          currency_code: r.code,
          currency_name_tr: meta.name_tr,
          currency_name_en: meta.name_en,
          rate: r.forexSelling / r.unit,
          unit: r.unit,
          flag_emoji: meta.flag,
          symbol: meta.symbol,
          updated_at: new Date().toISOString(),
        };
      });

    const { error } = await supabase.from('exchange_rates').upsert(rows, { onConflict: 'currency_code' });
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, count: rows.length, currencies: rows.map((r) => r.currency_code) }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
