-- Happy Hour / Zamanlı Fiyat kolonları
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS happy_hour_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_label TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_days TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_end_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS happy_hour_active BOOLEAN DEFAULT FALSE;

-- İndeks
CREATE INDEX IF NOT EXISTS idx_menu_items_happy_hour
  ON menu_items(restaurant_id, happy_hour_active)
  WHERE happy_hour_active = true;
