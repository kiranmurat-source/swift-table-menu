-- Nutri-Score: AB beslenme kalitesi skalası (A-E)
-- menu_items.nutri_score NULL veya 'A' | 'B' | 'C' | 'D' | 'E'
-- Public menüde kcal badge'inin yanında küçük renkli badge olarak gösterilir.

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS nutri_score TEXT DEFAULT NULL;

ALTER TABLE menu_items
  DROP CONSTRAINT IF EXISTS menu_items_nutri_score_check;

ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_nutri_score_check
  CHECK (nutri_score IS NULL OR nutri_score IN ('A', 'B', 'C', 'D', 'E'));
