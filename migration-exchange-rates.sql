-- Multi-currency / TCMB kuru sistemi için DB şeması
-- Supabase Dashboard > SQL Editor'de çalıştırılacak

-- 1) exchange_rates tablosu
CREATE TABLE IF NOT EXISTS exchange_rates (
  currency_code TEXT PRIMARY KEY,
  currency_name_tr TEXT NOT NULL,
  currency_name_en TEXT NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  unit INTEGER NOT NULL DEFAULT 1,
  flag_emoji TEXT,
  symbol TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_rates_public_read" ON exchange_rates;
CREATE POLICY "exchange_rates_public_read"
  ON exchange_rates FOR SELECT
  USING (true);

-- 2) restaurants.feature_multi_currency toggle
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS feature_multi_currency BOOLEAN DEFAULT FALSE;
