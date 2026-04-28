-- ============================================================================
-- PR2 — Membership RPCs + Expire Subscriptions Cron
-- ============================================================================
--
-- Date: 2026-04-27
-- Spec: PR2-membership-rpcs.md (project root)
--
-- Creates 5 atomic RPCs for super-admin membership management plus 1 cron-
-- driven expiry RPC. Replaces the multi-statement, non-atomic frontend writes
-- in SuperAdminDashboard.tsx (those frontend changes land in PR3). Also
-- rotates the daily expiry cron from the incomplete `expire-trials-hourly`
-- to a catch-all `expire-subscriptions-daily`.
--
-- DO NOT RUN `supabase db push` WITH THIS FILE.
-- Project convention: migrations live under version control but are applied
-- manually via the Supabase SQL Editor. See
-- supabase/migrations/20260422_draft_slug_trigger.sql for the canonical note.
--
-- Workflow:
--   1. Edit this file (canonical source of truth).
--   2. Paste `studio-pr2-apply.sql` (mirror, BEGIN/COMMIT wrapped) into Studio.
--   3. Run `studio-pr2-verify.sql` to confirm post-apply state.
--
-- Out of scope:
--   * Frontend handler rewrites (PR3)
--   * is_active enforcement on reads (PR4)
--   * Modifying handle_new_user(), expire_trials(), consume_ai_credits()
--
-- The legacy `expire_trials()` function is intentionally NOT dropped — it
-- remains in the DB for safety, only the cron schedule is rotated away from
-- it.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- RPC 1: subscription_create
-- ----------------------------------------------------------------------------
-- Replaces SuperAdminDashboard.tsx addSubscription() — atomic insert into
-- subscriptions + restaurants update in a single SECURITY DEFINER call.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscription_create(
  p_restaurant_id UUID,
  p_plan_name TEXT,
  p_start_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_plan_id UUID;
  v_credits INT;
  v_start_date DATE;
  v_end_date DATE;
  v_subscription_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_plan_name NOT IN ('basic', 'premium', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan name: %', p_plan_name;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
  END IF;

  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE name = p_plan_name;
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'subscription_plans row missing for name=%', p_plan_name;
  END IF;

  v_credits := CASE p_plan_name
    WHEN 'basic' THEN 60
    WHEN 'premium' THEN 150
    WHEN 'enterprise' THEN 300
  END;

  v_start_date := COALESCE(p_start_date, CURRENT_DATE);
  v_end_date := v_start_date + INTERVAL '1 year';

  INSERT INTO public.subscriptions (
    restaurant_id, plan_id, start_date, end_date, status, payment_method, notes
  ) VALUES (
    p_restaurant_id, v_plan_id, v_start_date, v_end_date, 'active', 'manual', p_notes
  )
  RETURNING id INTO v_subscription_id;

  UPDATE public.restaurants
  SET current_plan = p_plan_name,
      subscription_status = 'active',
      is_active = true,
      ai_credits_total = v_credits,
      ai_credits_used = 0,
      updated_at = NOW()
  WHERE id = p_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'end_date', v_end_date,
    'ai_credits_total', v_credits
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- RPC 2: subscription_extend
-- ----------------------------------------------------------------------------
-- Replaces SuperAdminDashboard.tsx extendSubscription(). Renews end_date,
-- resets credit pool to the plan's full quota, and revives status='active'
-- if the row had been expired/cancelled.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscription_extend(
  p_subscription_id UUID,
  p_new_end_date DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
  v_plan_id UUID;
  v_plan_name TEXT;
  v_credits INT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.restaurant_id, s.plan_id INTO v_restaurant_id, v_plan_id
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  IF p_new_end_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'New end_date must be in the future: %', p_new_end_date;
  END IF;

  SELECT name INTO v_plan_name FROM public.subscription_plans WHERE id = v_plan_id;
  IF v_plan_name IS NULL THEN
    RAISE EXCEPTION 'Plan row missing for plan_id=%', v_plan_id;
  END IF;

  v_credits := CASE v_plan_name
    WHEN 'basic' THEN 60
    WHEN 'premium' THEN 150
    WHEN 'enterprise' THEN 300
    ELSE NULL
  END;

  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'Unknown plan name on subscription: %', v_plan_name;
  END IF;

  UPDATE public.subscriptions
  SET end_date = p_new_end_date,
      status = 'active'
  WHERE id = p_subscription_id;

  UPDATE public.restaurants
  SET subscription_status = 'active',
      is_active = true,
      ai_credits_total = v_credits,
      ai_credits_used = 0,
      updated_at = NOW()
  WHERE id = v_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'end_date', p_new_end_date,
    'ai_credits_total', v_credits
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- RPC 3: subscription_change_plan
-- ----------------------------------------------------------------------------
-- Replaces SuperAdminDashboard.tsx changePlan(). Switches tier mid-cycle and
-- resets the credit pool (Murat's decision: plan change = fresh credits).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscription_change_plan(
  p_subscription_id UUID,
  p_new_plan_name TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
  v_new_plan_id UUID;
  v_new_credits INT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_new_plan_name NOT IN ('basic', 'premium', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan name: %', p_new_plan_name;
  END IF;

  SELECT s.restaurant_id INTO v_restaurant_id
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  SELECT id INTO v_new_plan_id FROM public.subscription_plans WHERE name = p_new_plan_name;
  IF v_new_plan_id IS NULL THEN
    RAISE EXCEPTION 'subscription_plans row missing for name=%', p_new_plan_name;
  END IF;

  v_new_credits := CASE p_new_plan_name
    WHEN 'basic' THEN 60
    WHEN 'premium' THEN 150
    WHEN 'enterprise' THEN 300
  END;

  UPDATE public.subscriptions
  SET plan_id = v_new_plan_id
  WHERE id = p_subscription_id;

  UPDATE public.restaurants
  SET current_plan = p_new_plan_name,
      ai_credits_total = v_new_credits,
      ai_credits_used = 0,
      updated_at = NOW()
  WHERE id = v_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_plan', p_new_plan_name,
    'ai_credits_total', v_new_credits
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- RPC 4: subscription_cancel
-- ----------------------------------------------------------------------------
-- Replaces SuperAdminDashboard.tsx cancelSubscription() (which previously
-- wrote current_plan='cancelled' and silently failed the CHECK constraint).
-- New behaviour: status='cancelled', is_active=false. Plan and credits are
-- preserved so a later subscription_reactivate can restore the prior state.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscription_cancel(
  p_subscription_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.restaurant_id INTO v_restaurant_id
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  UPDATE public.subscriptions
  SET status = 'cancelled'
  WHERE id = p_subscription_id;

  UPDATE public.restaurants
  SET subscription_status = 'cancelled',
      is_active = false,
      updated_at = NOW()
  WHERE id = v_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'restaurant_id', v_restaurant_id
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- RPC 5: subscription_reactivate
-- ----------------------------------------------------------------------------
-- New capability — restores a cancelled or expired subscription. Credits
-- resume on reactivate (Murat's decision); plan was preserved at cancel.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.subscription_reactivate(
  p_subscription_id UUID,
  p_new_end_date DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_restaurant_id UUID;
  v_status TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT s.restaurant_id, s.status INTO v_restaurant_id, v_status
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  IF v_status NOT IN ('cancelled', 'expired') THEN
    RAISE EXCEPTION 'Cannot reactivate subscription with status=%', v_status;
  END IF;

  IF p_new_end_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'New end_date must be in the future: %', p_new_end_date;
  END IF;

  UPDATE public.subscriptions
  SET status = 'active',
      end_date = p_new_end_date
  WHERE id = p_subscription_id;

  UPDATE public.restaurants
  SET subscription_status = 'active',
      is_active = true,
      updated_at = NOW()
  WHERE id = v_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'end_date', p_new_end_date
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- RPC 6: expire_subscriptions  (cron-driven)
-- ----------------------------------------------------------------------------
-- Catch-all replacement for the legacy expire_trials() cron. Marks any
-- active/trial subscription whose end_date has passed as expired AND
-- propagates to the restaurants row (subscription_status='expired',
-- is_active=false). current_plan and ai_credits_* are preserved so a later
-- super-admin extension can restore service cleanly.
--
-- Not gated by is_super_admin() — invoked from pg_cron which runs as the
-- scheduling user (postgres). The function remains SECURITY DEFINER for
-- consistency with the others.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_expired_count INT;
BEGIN
  WITH expired AS (
    UPDATE public.subscriptions
    SET status = 'expired'
    WHERE status IN ('active', 'trial')
      AND end_date < CURRENT_DATE
    RETURNING restaurant_id
  ),
  restaurant_updates AS (
    UPDATE public.restaurants
    SET subscription_status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE id IN (SELECT restaurant_id FROM expired)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_count FROM restaurant_updates;

  RETURN jsonb_build_object(
    'success', true,
    'expired_count', v_expired_count,
    'ran_at', NOW()
  );
END;
$function$;


-- ----------------------------------------------------------------------------
-- Cron rotation
-- ----------------------------------------------------------------------------
-- 1. Unschedule the legacy hourly trial-only job (no-op if absent).
-- 2. Unschedule any pre-existing daily catch-all (idempotent re-runs).
-- 3. Schedule the daily catch-all at 00:05 server time.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('expire-trials-hourly');
  RAISE NOTICE 'PR2 cron: unscheduled expire-trials-hourly';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PR2 cron: expire-trials-hourly was not scheduled, skipping';
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-subscriptions-daily');
  RAISE NOTICE 'PR2 cron: unscheduled previous expire-subscriptions-daily (re-run)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PR2 cron: no previous expire-subscriptions-daily to clear';
END $$;

SELECT cron.schedule(
  'expire-subscriptions-daily',
  '5 0 * * *',
  $cron$ SELECT public.expire_subscriptions(); $cron$
);


-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------
-- Super-admin RPCs are callable by `authenticated` (the inner is_super_admin()
-- check enforces actual authorization) and by `service_role` for backend use.
-- expire_subscriptions is restricted to service_role + the function owner
-- (postgres / pg_cron) — never callable by end users directly.
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.subscription_create(UUID, TEXT, DATE, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.subscription_extend(UUID, DATE)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.subscription_change_plan(UUID, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.subscription_cancel(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.subscription_reactivate(UUID, DATE)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions()
  TO service_role;
