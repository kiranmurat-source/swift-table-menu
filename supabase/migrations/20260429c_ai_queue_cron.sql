-- ============================================================================
-- Schedule the process-ai-queue worker to run every 10 seconds.
-- Requires:
--   - pg_cron 1.6+ (sub-minute scheduling) — verified PR0
--   - pg_net (for net.http_post) — Supabase default
--   - public.cron_invoke_ai_worker() — created by 20260429d_ai_queue_cron_invoker.sql
--     (apply 20260429d FIRST so the wrapper exists before this schedule fires)
--
-- The wrapper exists because Supabase managed Postgres doesn't allow
-- `ALTER DATABASE ... SET app.cron_secret`. The service_role JWT lives inside
-- the SECURITY DEFINER function body (not in the cron.job table), so this
-- schedule itself has no secrets.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-ai-queue') THEN
    PERFORM cron.unschedule('process-ai-queue');
  END IF;
END$$;

SELECT cron.schedule(
  'process-ai-queue',
  '10 seconds',
  $$ SELECT public.cron_invoke_ai_worker(); $$
);

COMMIT;
