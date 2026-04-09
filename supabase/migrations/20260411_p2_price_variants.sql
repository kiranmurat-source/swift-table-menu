-- P2-1: Price variants on menu items
-- 11 Nisan 2026
-- Format:
-- [
--   { "name_tr": "Küçük", "name_en": "Small",  "price": 65, "calories": 120 },
--   { "name_tr": "Orta",  "name_en": "Medium", "price": 80, "calories": 180 }
-- ]
-- Empty array = single-price mode (existing price column is used).
-- Populated array = multi-price mode; the price column is kept in sync with
-- the minimum variant price for sorting/filtering/SEO.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS price_variants jsonb NOT NULL DEFAULT '[]'::jsonb;
