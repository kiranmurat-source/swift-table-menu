-- Plan tier gating: hybrid TypeScript-default + DB-override model
-- Adds restaurants.plan_overrides JSONB and grandfathers all existing rows
-- with the current full feature set so customer experience does not change.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN restaurants.plan_overrides IS
  'Super admin overrides for plan tier features. Shape: {"feature_key": true|false}. If key absent, plan default applies.';

-- Backfill: grandfather every existing restaurant with the full operational
-- feature set ON. New rows default to '{}' (pure plan default).
UPDATE restaurants
SET plan_overrides = jsonb_build_object(
  'likes', true,
  'cart', true,
  'whatsapp_order', true,
  'feedback', true,
  'discount_codes', true,
  'multi_currency', true,
  'waiter_calls', true,
  'google_reviews_redirect', true,
  'feedback_form', true,
  'local_seo', true
)
WHERE plan_overrides = '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_restaurants_plan_overrides
  ON restaurants USING GIN (plan_overrides);
