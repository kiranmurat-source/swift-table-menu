-- Geri bildirim tablosu
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  customer_name TEXT DEFAULT '',
  table_number TEXT DEFAULT NULL,
  language TEXT DEFAULT 'tr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_restaurant ON feedback(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(restaurant_id, created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Restaurant owner can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

CREATE POLICY "Restaurant owner can delete own feedback"
  ON feedback FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Google Place ID + Feature toggle
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS google_place_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS feature_feedback BOOLEAN DEFAULT TRUE;
