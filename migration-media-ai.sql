-- ==========================================================================
-- Medya Kütüphanesi + AI Kredi Sistemi + AI Kullanım Logu
-- Parça 1: DB şema değişiklikleri
-- ==========================================================================

-- 1) Medya kütüphanesi tablosu
CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  file_hash TEXT,
  tags TEXT[] DEFAULT '{}',
  used_in JSONB DEFAULT '[]',
  ai_enhanced BOOLEAN DEFAULT false,
  original_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_library_restaurant ON media_library(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_media_library_hash ON media_library(restaurant_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_media_library_created ON media_library(restaurant_id, created_at DESC);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_library_select" ON media_library;
CREATE POLICY "media_library_select" ON media_library
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "media_library_insert" ON media_library;
CREATE POLICY "media_library_insert" ON media_library
  FOR INSERT WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "media_library_update" ON media_library;
CREATE POLICY "media_library_update" ON media_library
  FOR UPDATE USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "media_library_delete" ON media_library;
CREATE POLICY "media_library_delete" ON media_library
  FOR DELETE USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 2) Storage kota takibi (restaurants)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 500;
-- Plan bazlı: Basic=500MB, Pro=2000MB, Premium=5000MB

-- 3) AI kredi sistemi (restaurants)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_credits_total INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0;
-- Plan bazlı yıllık: Pro=60, Premium=150

-- 4) AI kullanım logu
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  input_data JSONB,
  output_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_restaurant ON ai_usage_log(restaurant_id, created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_log_select" ON ai_usage_log;
CREATE POLICY "ai_usage_log_select" ON ai_usage_log
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Insert is typically done from Edge Function with service role, ama admin'den de log yazılabilsin:
DROP POLICY IF EXISTS "ai_usage_log_insert" ON ai_usage_log;
CREATE POLICY "ai_usage_log_insert" ON ai_usage_log
  FOR INSERT WITH CHECK (
    restaurant_id IN (SELECT restaurant_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
