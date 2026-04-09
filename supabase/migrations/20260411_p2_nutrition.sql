-- P2-2: Nutrition facts
-- 11 Nisan 2026
-- Format:
-- {
--   "serving_size": "1 porsiyon (250g)",
--   "calories": 450,
--   "calories_from_fat": 120,
--   "total_fat": 13,
--   "saturated_fat": 5,
--   "trans_fat": 0,
--   "cholesterol": 65,
--   "sodium": 780,
--   "total_carb": 52,
--   "dietary_fiber": 3,
--   "sugars": 8,
--   "protein": 28,
--   "vitamin_a": 15,
--   "vitamin_c": 4,
--   "calcium": 20,
--   "iron": 25,
--   "show_on_menu": true
-- }
-- NULL = no nutrition facts entered. Existing calories column is kept in sync
-- with nutrition.calories when nutrition is populated.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS nutrition jsonb DEFAULT NULL;
