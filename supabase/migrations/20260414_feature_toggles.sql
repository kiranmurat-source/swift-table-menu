-- Restoran bazlı özellik toggle'ları
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS feature_waiter_calls BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS feature_cart BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS feature_whatsapp_order BOOLEAN DEFAULT TRUE;
