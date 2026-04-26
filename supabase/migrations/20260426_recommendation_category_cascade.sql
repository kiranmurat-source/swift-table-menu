-- Recommendation cascade: category required, item optional (random fallback per category)

ALTER TABLE item_recommendations
  ADD COLUMN IF NOT EXISTS recommended_category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE;

-- Backfill category from existing item references
UPDATE item_recommendations ir
SET recommended_category_id = mi.category_id
FROM menu_items mi
WHERE ir.recommended_item_id = mi.id
  AND ir.recommended_category_id IS NULL;

-- Now make category NOT NULL (after backfill so existing rows aren't broken)
ALTER TABLE item_recommendations
  ALTER COLUMN recommended_category_id SET NOT NULL;

-- Make item nullable (was likely NOT NULL before)
ALTER TABLE item_recommendations
  ALTER COLUMN recommended_item_id DROP NOT NULL;

-- Consistency check: if item is set, category must also be set
ALTER TABLE item_recommendations
  DROP CONSTRAINT IF EXISTS item_belongs_to_category;

ALTER TABLE item_recommendations
  ADD CONSTRAINT item_belongs_to_category
  CHECK (
    recommended_item_id IS NULL
    OR recommended_category_id IS NOT NULL
  );

-- Index for category-based random lookup performance
CREATE INDEX IF NOT EXISTS idx_item_recommendations_category
  ON item_recommendations(recommended_category_id);
