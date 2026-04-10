-- waiter_calls tablosu
CREATE TABLE waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'cancelled')),
  call_type TEXT NOT NULL DEFAULT 'waiter' CHECK (call_type IN ('waiter', 'bill', 'water', 'other')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indeksler
CREATE INDEX idx_waiter_calls_restaurant ON waiter_calls(restaurant_id);
CREATE INDEX idx_waiter_calls_status ON waiter_calls(restaurant_id, status) WHERE status = 'pending';
CREATE INDEX idx_waiter_calls_created ON waiter_calls(created_at DESC);

-- RLS
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- Public INSERT (auth gerektirmez)
CREATE POLICY "Anyone can create waiter calls"
  ON waiter_calls FOR INSERT
  WITH CHECK (true);

-- Restaurant kullanicisi kendi cagrilarini gorebilir
CREATE POLICY "Restaurant users can view own calls"
  ON waiter_calls FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Restaurant kullanicisi kendi cagrilarini guncelleyebilir
CREATE POLICY "Restaurant users can update own calls"
  ON waiter_calls FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Super admin silebilir
CREATE POLICY "Super admin can delete calls"
  ON waiter_calls FOR DELETE
  USING (is_super_admin());

-- Realtime enable
ALTER PUBLICATION supabase_realtime ADD TABLE waiter_calls;
