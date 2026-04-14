-- =====================================================================
-- Migration: Recommendations + Video Menu + Red Theme Removal
-- Date: 2026-04-14
-- Run from Supabase Dashboard → SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) item_recommendations table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  recommended_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  reason_tr TEXT,
  reason_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, recommended_item_id),
  CHECK (menu_item_id <> recommended_item_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_item
  ON item_recommendations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommended
  ON item_recommendations(recommended_item_id);

ALTER TABLE item_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read recommendations" ON item_recommendations;
CREATE POLICY "Anyone can read recommendations"
  ON item_recommendations FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Owner can manage own recommendations" ON item_recommendations;
CREATE POLICY "Owner can manage own recommendations"
  ON item_recommendations FOR ALL
  TO authenticated
  USING (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN profiles p ON p.restaurant_id = mi.restaurant_id
      WHERE p.id = auth.uid()
    )
    OR is_super_admin()
  )
  WITH CHECK (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN profiles p ON p.restaurant_id = mi.restaurant_id
      WHERE p.id = auth.uid()
    )
    OR is_super_admin()
  );

-- ---------------------------------------------------------------------
-- 2) menu_items.video_url
-- ---------------------------------------------------------------------
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ---------------------------------------------------------------------
-- 3) Red theme → white
-- ---------------------------------------------------------------------
UPDATE restaurants SET theme_color = 'white' WHERE theme_color = 'red';
