-- =====================================================================
-- Migration: Menu analytics (page views + item view duration + RPCs)
-- Date: 2026-04-14
-- Run from Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1) Menu page views
CREATE TABLE IF NOT EXISTS menu_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  fingerprint TEXT,
  table_number TEXT,
  language TEXT DEFAULT 'tr',
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_restaurant ON menu_page_views(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON menu_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_restaurant_created ON menu_page_views(restaurant_id, created_at);

ALTER TABLE menu_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page views" ON menu_page_views;
CREATE POLICY "Anyone can insert page views"
  ON menu_page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owner can view own page views" ON menu_page_views;
CREATE POLICY "Owner can view own page views"
  ON menu_page_views FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "Super admin can delete page views" ON menu_page_views;
CREATE POLICY "Super admin can delete page views"
  ON menu_page_views FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- 2) Item view duration column
ALTER TABLE menu_item_views ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- 3) Daily page view counts
CREATE OR REPLACE FUNCTION get_page_view_counts(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(view_date DATE, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(mpv.created_at) AS view_date, COUNT(*)::BIGINT AS view_count
  FROM menu_page_views mpv
  WHERE mpv.restaurant_id = p_restaurant_id
    AND mpv.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(mpv.created_at)
  ORDER BY view_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Total page views
CREATE OR REPLACE FUNCTION get_total_page_views(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::BIGINT
    FROM menu_page_views
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Item avg duration (per item)
CREATE OR REPLACE FUNCTION get_item_avg_duration(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(menu_item_id UUID, avg_duration NUMERIC, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    miv.menu_item_id,
    ROUND(AVG(miv.duration_seconds)::NUMERIC, 1) AS avg_duration,
    COUNT(*)::BIGINT AS view_count
  FROM menu_item_views miv
  WHERE miv.restaurant_id = p_restaurant_id
    AND miv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND miv.duration_seconds IS NOT NULL
    AND miv.duration_seconds > 0
    AND miv.duration_seconds < 300
  GROUP BY miv.menu_item_id
  ORDER BY view_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Hourly page views (heatmap)
CREATE OR REPLACE FUNCTION get_hourly_page_views(
  p_restaurant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(hour_of_day INTEGER, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM mpv.created_at)::INTEGER AS hour_of_day,
    COUNT(*)::BIGINT AS view_count
  FROM menu_page_views mpv
  WHERE mpv.restaurant_id = p_restaurant_id
    AND mpv.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
