-- İndirim kodları tablosu
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: aynı restoranda aynı kod olamaz
CREATE UNIQUE INDEX idx_discount_code_unique ON discount_codes(restaurant_id, UPPER(code));

-- Index'ler
CREATE INDEX idx_discount_restaurant ON discount_codes(restaurant_id);
CREATE INDEX idx_discount_active ON discount_codes(restaurant_id, is_active);

-- RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Restoran sahibi kendi kodlarını yönetebilir
CREATE POLICY "Restaurant owner can manage own discount codes"
  ON discount_codes FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
    OR is_super_admin()
  );

-- Public (anonim) kod doğrulama için SELECT
CREATE POLICY "Anyone can validate discount codes"
  ON discount_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- RPC: güvenli kullanım sayacı artırma (anon user sadece increment yapabilir)
CREATE OR REPLACE FUNCTION increment_discount_usage(p_restaurant_id UUID, p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1
  WHERE restaurant_id = p_restaurant_id
    AND UPPER(code) = UPPER(p_code)
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feature toggle
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS feature_discount_codes BOOLEAN DEFAULT TRUE;
