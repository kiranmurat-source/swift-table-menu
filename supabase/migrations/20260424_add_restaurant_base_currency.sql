-- Add base_currency column to restaurants.
-- Defines the operational currency for each restaurant: prices are entered,
-- stored, and processed in this currency. Customer-facing display currency
-- may differ (via the currency dropdown) but all operations (cart totals,
-- orders, discounts, WhatsApp messages) stay in base.

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS base_currency TEXT NOT NULL DEFAULT 'TRY';

-- DEFAULT covers existing rows, but explicit backfill for safety.
UPDATE restaurants SET base_currency = 'TRY' WHERE base_currency IS NULL;

-- Validation: base_currency must be 'TRY' or exist in exchange_rates.
-- Postgres CHECK constraints cannot reference subqueries, so we use a
-- BEFORE-trigger that raises on invalid values.
CREATE OR REPLACE FUNCTION validate_restaurant_base_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.base_currency = 'TRY' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM exchange_rates WHERE currency_code = NEW.base_currency
  ) THEN
    RAISE EXCEPTION 'Invalid base_currency: % is not in exchange_rates table. Must be TRY or one of the supported currencies.', NEW.base_currency;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_base_currency_trigger ON restaurants;
CREATE TRIGGER validate_base_currency_trigger
BEFORE INSERT OR UPDATE OF base_currency ON restaurants
FOR EACH ROW
EXECUTE FUNCTION validate_restaurant_base_currency();

COMMENT ON COLUMN restaurants.base_currency IS 'ISO 4217 code. Operational currency: prices, cart totals, orders all in this currency. Defaults to TRY. Must be TRY or exist in exchange_rates table.';
