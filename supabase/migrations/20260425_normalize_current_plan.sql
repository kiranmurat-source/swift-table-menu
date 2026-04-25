-- ============================================================================
-- Migration: Normalize current_plan values
-- Date: 2026-04-25
-- Purpose: Standardize plan tier values to match planFeatures.ts source of truth
--          Old: 'pro', 'Premium', 'basic' (inconsistent casing, deprecated tier)
--          New: 'basic', 'premium', 'enterprise' (lowercase, 3 valid tiers)
--
-- NOTE: This migration was applied manually to production on 2026-04-25
--       via Supabase Dashboard SQL editor. This file exists for reproducibility
--       in other environments (staging, future dev DBs).
-- ============================================================================

-- Step 1: Normalize casing (Premium -> premium, etc.)
UPDATE restaurants
SET current_plan = LOWER(current_plan)
WHERE current_plan IS NOT NULL
  AND current_plan != LOWER(current_plan);

-- Step 2: Roll up deprecated 'pro' tier into 'premium'
UPDATE restaurants
SET current_plan = 'premium'
WHERE current_plan = 'pro';

-- Step 3: Default any NULL or unrecognized values to 'basic'
UPDATE restaurants
SET current_plan = 'basic'
WHERE current_plan IS NULL
   OR current_plan NOT IN ('basic', 'premium', 'enterprise');

-- Step 4: Add NOT NULL constraint
ALTER TABLE restaurants
  ALTER COLUMN current_plan SET NOT NULL;

-- Step 5: Add CHECK constraint enforcing valid plan tiers (idempotent)
ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS current_plan_valid;

ALTER TABLE restaurants
  ADD CONSTRAINT current_plan_valid
  CHECK (current_plan IN ('basic', 'premium', 'enterprise'));

-- Step 6: Set default for new rows
ALTER TABLE restaurants
  ALTER COLUMN current_plan SET DEFAULT 'basic';
