-- ============================================================================
-- DRAFT SLUG TRIGGER — PRODUCTION MIRROR
-- ============================================================================
--
-- This file is a version-controlled mirror of the trigger/function currently
-- live in Supabase production (project qmnrawqvkwehufebbkxp). It was
-- extracted on 2026-04-22 to bring the database-side producer of the
-- `temp-{uuid}` slug convention under version control.
--
-- DO NOT RUN `supabase db push` WITH THIS FILE.
-- The production database already contains this trigger — pushing would
-- either no-op (if identical) or create conflicts (if it has drifted).
--
-- Workflow going forward:
--   1. To change this trigger, edit this file FIRST
--   2. Then manually paste the new version into the Supabase SQL Editor
--   3. Verify the change in staging / test restaurant, then commit
--
-- The TypeScript mirror of the prefix constant lives in
-- `src/lib/slug.ts` (DRAFT_SLUG_PREFIX). Keep both in sync.
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_restaurant_id UUID;
  v_basic_plan_id UUID := '8b7e331c-64c5-4b48-9abe-4cfb12382b7e'::uuid;
  v_temp_slug TEXT;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  v_user_email := NEW.email;
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_temp_slug := 'temp-' || substring(NEW.id::text, 1, 8);

  INSERT INTO public.restaurants (
    name, slug, is_active, subscription_status, current_plan,
    trial_ends_at, onboarding_completed_at,
    ai_credits_total, ai_credits_used
  ) VALUES (
    'İsimsiz Restoran',
    v_temp_slug,
    true,
    'trial',
    'basic',
    NOW() + INTERVAL '14 days',
    NULL,
    15,     -- 15 credits = exactly 1 AI description for wizard demo
    0
  )
  RETURNING id INTO v_restaurant_id;

  INSERT INTO public.profiles (id, email, full_name, role, restaurant_id)
  VALUES (NEW.id, v_user_email, v_user_name, 'restaurant', v_restaurant_id);

  INSERT INTO public.subscriptions (
    restaurant_id, plan_id, start_date, end_date,
    status, payment_method, notes
  ) VALUES (
    v_restaurant_id, v_basic_plan_id,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days',
    'active', 'trial',
    'Auto-created by Google signup trigger'
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
