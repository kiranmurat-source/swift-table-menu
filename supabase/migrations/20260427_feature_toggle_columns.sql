-- Add 4 new feature toggle columns for plan-aware admin UI pilot
-- Default TRUE: when a plan unlocks the feature, it is on by default until
-- the restaurant explicitly toggles it off. Reduces "nothing works" friction.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS feature_table_reservation BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_table_payment    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_digital_tip      BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS feature_group_payment    BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN restaurants.feature_table_reservation IS 'Restaurant preference: enable table reservation UI in public menu (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_table_payment    IS 'Restaurant preference: enable QR pay-at-table flow (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_digital_tip      IS 'Restaurant preference: enable digital tipping at checkout (Tahsilat pillar, Enterprise plan)';
COMMENT ON COLUMN restaurants.feature_group_payment    IS 'Restaurant preference: enable split-bill / group payment flow (Tahsilat pillar, Enterprise plan)';
