-- P1 Menu Editing UX — sub-categories, sold-out, scheduling
-- 11 Nisan 2026

-- 1) Sub-category support
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS menu_categories_parent_id_idx
  ON menu_categories(parent_id);

-- 2) Sold-out (86'd) flag
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_sold_out boolean NOT NULL DEFAULT false;

-- 3) Item scheduling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'schedule_type'
  ) THEN
    ALTER TABLE menu_items
      ADD COLUMN schedule_type text NOT NULL DEFAULT 'always'
        CHECK (schedule_type IN ('always', 'date_range', 'periodic'));
  END IF;
END $$;

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS schedule_start timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_end   timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_periodic jsonb NOT NULL DEFAULT '{}'::jsonb;
