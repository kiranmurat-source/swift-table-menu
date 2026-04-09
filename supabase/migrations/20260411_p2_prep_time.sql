-- P2-2: Preparation time (minutes)
-- 11 Nisan 2026
-- prep_time: integer minutes. NULL = not specified (hidden in UI).

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS prep_time integer DEFAULT NULL;
