-- ============================================================================
-- cron_invoke_ai_worker — SECURITY DEFINER wrapper around net.http_post for the
-- pg_cron job that drives process-ai-queue.
--
-- Why a wrapper:
--   Supabase managed Postgres does not allow `ALTER DATABASE ... SET app.*`
--   (permission denied), and the `vault` extension is not installed. So we
--   cannot use the typical `current_setting('app.cron_secret', true)` pattern.
--   Instead, the service_role JWT is embedded inline as a literal in this
--   function's body. Only the function owner (postgres) and grantees can read
--   the body via pg_proc; PUBLIC/anon/authenticated/regular roles cannot.
--
-- BEFORE APPLYING:
--   Replace the placeholder string PASTE_SERVICE_ROLE_JWT_HERE below with the
--   actual SUPABASE service_role JWT (Project Settings → API → service_role).
--   Do NOT commit the real key into git — paste it only when running the
--   migration in the Supabase SQL Editor. The migration file in git keeps the
--   placeholder.
--
-- After this migration runs, re-apply 20260429c_ai_queue_cron.sql so the cron
-- schedule calls public.cron_invoke_ai_worker() instead of inline net.http_post.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.cron_invoke_ai_worker()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_service_role_key TEXT := 'PASTE_SERVICE_ROLE_JWT_HERE';
BEGIN
  PERFORM net.http_post(
    url := 'https://qmnrawqvkwehufebbkxp.supabase.co/functions/v1/process-ai-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cron_invoke_ai_worker() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_invoke_ai_worker() FROM anon;
REVOKE ALL ON FUNCTION public.cron_invoke_ai_worker() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cron_invoke_ai_worker() TO service_role;

COMMIT;
