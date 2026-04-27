-- ============================================================================
-- Migration: Seed subscription_plans + cleanup current_plan data (PR1)
-- Date: 2026-04-27
-- Purpose: Make subscription_plans the canonical source of plan metadata,
--          ensure restaurants.current_plan always holds 'basic' | 'premium'
--          | 'enterprise', and clean any pre-existing rows that violate this.
--
-- Scope (PR1 only — see PR1-seed-plans-and-cleanup.md):
--   * Seed Premium + Enterprise rows in subscription_plans
--   * Normalize Basic plan name to lowercase (preserve hardcoded UUID
--     8b7e331c-64c5-4b48-9abe-4cfb12382b7e referenced by handle_new_user())
--   * Coerce restaurants.current_plan to strict lowercase tier values
--   * Add UNIQUE(name) on subscription_plans for idempotency
--
-- Out of scope: RPCs (PR2), frontend (PR3), is_active enforcement (PR4)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Pre-migration audit (RAISE NOTICE only, no writes)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  plan_count INT;
  restaurant_count INT;
  bad_plan_count INT;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM public.subscription_plans;
  SELECT COUNT(*) INTO restaurant_count FROM public.restaurants;
  SELECT COUNT(*) INTO bad_plan_count
    FROM public.restaurants
    WHERE current_plan IS NULL
       OR current_plan NOT IN ('basic', 'premium', 'enterprise');

  RAISE NOTICE 'PR1 pre-migration: % subscription_plans rows, % restaurants, % restaurants with invalid current_plan',
    plan_count, restaurant_count, bad_plan_count;
END $$;

-- ----------------------------------------------------------------------------
-- Step 2: Clean restaurants.current_plan (idempotent)
--
-- 20260425_normalize_current_plan.sql already did this once, but re-running is
-- a no-op when data is already clean. Belt-and-suspenders for any drift.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  rows_updated INT;
BEGIN
  WITH updated AS (
    UPDATE public.restaurants
    SET current_plan = CASE
      WHEN LOWER(COALESCE(current_plan, '')) IN ('basic', 'premium', 'enterprise')
        THEN LOWER(current_plan)
      WHEN LOWER(COALESCE(current_plan, '')) = 'pro'
        THEN 'premium'
      ELSE 'basic'
    END
    WHERE current_plan IS NULL
       OR current_plan NOT IN ('basic', 'premium', 'enterprise')
    RETURNING 1
  )
  SELECT COUNT(*) INTO rows_updated FROM updated;

  RAISE NOTICE 'PR1 step 2: normalized current_plan on % restaurant row(s)', rows_updated;
END $$;

-- ----------------------------------------------------------------------------
-- Step 3a: Ensure subscription_plans.name has UNIQUE constraint
--
-- Conditional — only adds the constraint if no UNIQUE/PK index already covers
-- the `name` column. This guards against duplicate seeds on rerun.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  has_unique BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_attribute a
      ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'public.subscription_plans'::regclass
      AND i.indisunique
      AND i.indnatts = 1
      AND a.attname = 'name'
  ) INTO has_unique;

  IF NOT has_unique THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
    RAISE NOTICE 'PR1 step 3a: added UNIQUE(name) constraint on subscription_plans';
  ELSE
    RAISE NOTICE 'PR1 step 3a: UNIQUE(name) already exists on subscription_plans, skipping';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Step 3b: Normalize the existing Basic row
--
-- The UUID 8b7e331c-64c5-4b48-9abe-4cfb12382b7e is hardcoded in
-- handle_new_user() and referenced by production subscriptions.plan_id rows,
-- so we UPDATE in place rather than DELETE + INSERT.
-- ----------------------------------------------------------------------------
UPDATE public.subscription_plans
SET name = 'basic',
    price_yearly = 6588,
    sort_order = 1
WHERE id = '8b7e331c-64c5-4b48-9abe-4cfb12382b7e';

-- ----------------------------------------------------------------------------
-- Step 3c: Seed Premium + Enterprise rows (idempotent via ON CONFLICT)
-- ----------------------------------------------------------------------------
INSERT INTO public.subscription_plans (id, name, price_yearly, sort_order)
VALUES
  (gen_random_uuid(), 'premium', 17508, 2),
  (gen_random_uuid(), 'enterprise', 0, 3)
ON CONFLICT (name) DO NOTHING;

COMMENT ON COLUMN public.subscription_plans.price_yearly IS
  'Annual price in TL ex-VAT. 0 = custom/contact-sales (Enterprise sentinel).';

-- ----------------------------------------------------------------------------
-- Step 4: Verify CHECK constraint on restaurants.current_plan
--
-- The constraint `current_plan_valid` was created in
-- 20260425_normalize_current_plan.sql with values
-- ('basic','premium','enterprise'). This step asserts it's still there,
-- aborting the transaction if it has drifted.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'public.restaurants'::regclass
    AND contype = 'c'
    AND conname = 'current_plan_valid';

  IF constraint_def IS NULL THEN
    RAISE EXCEPTION 'PR1 step 4: expected CHECK constraint current_plan_valid is missing on public.restaurants';
  END IF;

  IF constraint_def NOT LIKE '%basic%'
     OR constraint_def NOT LIKE '%premium%'
     OR constraint_def NOT LIKE '%enterprise%' THEN
    RAISE EXCEPTION 'PR1 step 4: current_plan_valid drifted from expected values: %', constraint_def;
  END IF;

  RAISE NOTICE 'PR1 step 4: current_plan_valid verified: %', constraint_def;
END $$;

-- ----------------------------------------------------------------------------
-- Step 5: Post-migration verification
--
-- Aborts the transaction (and rolls back everything above) if the seed didn't
-- produce exactly 1 row per tier.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  basic_count INT;
  premium_count INT;
  enterprise_count INT;
  total_plans INT;
  basic_uuid_ok BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO total_plans FROM public.subscription_plans;
  SELECT COUNT(*) INTO basic_count
    FROM public.subscription_plans WHERE name = 'basic';
  SELECT COUNT(*) INTO premium_count
    FROM public.subscription_plans WHERE name = 'premium';
  SELECT COUNT(*) INTO enterprise_count
    FROM public.subscription_plans WHERE name = 'enterprise';
  SELECT EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE id = '8b7e331c-64c5-4b48-9abe-4cfb12382b7e'
      AND name = 'basic'
  ) INTO basic_uuid_ok;

  IF basic_count <> 1 OR premium_count <> 1 OR enterprise_count <> 1 THEN
    RAISE EXCEPTION 'PR1 seed verification failed: basic=%, premium=%, enterprise=%, total=%',
      basic_count, premium_count, enterprise_count, total_plans;
  END IF;

  IF NOT basic_uuid_ok THEN
    RAISE EXCEPTION 'PR1 seed verification failed: hardcoded basic UUID 8b7e331c-... no longer maps to name=basic';
  END IF;

  RAISE NOTICE 'PR1 post-migration: verified 1 basic, 1 premium, 1 enterprise; basic UUID intact';
END $$;
