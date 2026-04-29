-- ============================================================================
-- AI Queue worker support RPCs.
-- The worker (process-ai-queue Edge Function) uses Supabase-JS .rpc(), which
-- only invokes functions in the public schema. So we wrap pgmq.* calls and
-- atomic state transitions in public-schema SECURITY DEFINER functions.
--
-- Functions added here:
--   public.ai_queue_read(p_qty, p_vt)            → pgmq.read wrapper
--   public.ai_queue_delete(p_msg_id)             → pgmq.delete wrapper
--   public.ai_queue_send(p_payload)              → pgmq.send wrapper
--   public.ai_queue_lock_start(p_job_id)         → atomic queued→processing
--   public.ai_queue_complete_job(...)            → atomic charge + complete
--   public.consume_ai_credits_with_job(...)      → log-with-job_id variant
--
-- All grants restricted to service_role.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- pgmq wrappers (queue name pinned to 'ai_queue')
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ai_queue_read(
  p_qty INTEGER,
  p_vt  INTEGER
)
RETURNS TABLE (
  msg_id     BIGINT,
  read_ct    INTEGER,
  enqueued_at TIMESTAMPTZ,
  vt          TIMESTAMPTZ,
  message     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  RETURN QUERY
  SELECT q.msg_id, q.read_ct, q.enqueued_at, q.vt, q.message
  FROM pgmq.read('ai_queue', p_vt, p_qty) q;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_queue_read(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_queue_read(INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.ai_queue_delete(p_msg_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT pgmq.delete('ai_queue', p_msg_id) INTO v_ok;
  RETURN v_ok;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_queue_delete(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_queue_delete(BIGINT) TO service_role;

CREATE OR REPLACE FUNCTION public.ai_queue_send(p_payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_msg_id BIGINT;
BEGIN
  SELECT pgmq.send('ai_queue', p_payload) INTO v_msg_id;
  RETURN v_msg_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_queue_send(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_queue_send(JSONB) TO service_role;

-- ---------------------------------------------------------------------------
-- ai_queue_lock_start: atomic queued→processing transition.
-- Returns the locked job row if status was 'queued'; returns no rows otherwise
-- (signaling "skip this message — was cancelled or already running").
--
-- Note: every reference to ai_jobs columns must be qualified with alias `j`
-- because the RETURNS TABLE definition introduces OUT params named id, status,
-- attempt_count, etc. into the function's scope. Bare references would be
-- ambiguous and Postgres raises 42702 ("column reference is ambiguous").
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ai_queue_lock_start(p_job_id UUID)
RETURNS TABLE (
  id              UUID,
  restaurant_id   UUID,
  user_id         UUID,
  job_type        TEXT,
  status          TEXT,
  provider        TEXT,
  input_data      JSONB,
  attempt_count   INTEGER,
  max_attempts    INTEGER,
  credit_cost     INTEGER,
  credits_charged BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT j.status INTO v_status
  FROM public.ai_jobs j
  WHERE j.id = p_job_id
  FOR UPDATE;

  IF v_status IS NULL OR v_status <> 'queued' THEN
    RETURN;
  END IF;

  UPDATE public.ai_jobs AS j
  SET status = 'processing',
      started_at = now(),
      attempt_count = j.attempt_count + 1
  WHERE j.id = p_job_id;

  RETURN QUERY
  SELECT j.id, j.restaurant_id, j.user_id, j.job_type, j.status, j.provider,
         j.input_data, j.attempt_count, j.max_attempts, j.credit_cost, j.credits_charged
  FROM public.ai_jobs j
  WHERE j.id = p_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ai_queue_lock_start(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_queue_lock_start(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- consume_ai_credits_with_job: atomic credit decrement + log row with job_id.
-- Differs from consume_ai_credits in two ways:
--   1. Persists job_id into ai_usage_log
--   2. Does NOT raise on negative remainder — over-consumption is allowed when
--      the worker is settling work that was already done. Enqueue-time gate is
--      the real budget cap.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_ai_credits_with_job(
  p_restaurant_id UUID,
  p_amount        INTEGER,
  p_action_type   TEXT,
  p_input         JSONB,
  p_output        JSONB,
  p_job_id        UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_used  INTEGER;
BEGIN
  SELECT ai_credits_total, ai_credits_used INTO v_total, v_used
  FROM public.restaurants
  WHERE id = p_restaurant_id
  FOR UPDATE;

  IF v_total IS NULL THEN
    RAISE EXCEPTION 'RESTAURANT_NOT_FOUND' USING ERRCODE = '02000';
  END IF;

  UPDATE public.restaurants
  SET ai_credits_used = ai_credits_used + p_amount
  WHERE id = p_restaurant_id;

  INSERT INTO public.ai_usage_log (restaurant_id, action_type, credits_used, input_data, output_data, job_id)
  VALUES (p_restaurant_id, p_action_type, p_amount, p_input, p_output, p_job_id);

  RETURN jsonb_build_object(
    'credits_used_now', p_amount,
    'credits_remaining', v_total - (v_used + p_amount)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_credits_with_job(UUID, INTEGER, TEXT, JSONB, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_credits_with_job(UUID, INTEGER, TEXT, JSONB, JSONB, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- ai_queue_complete_job: idempotent atomic close-out.
-- If credits_charged=false, charges via consume_ai_credits_with_job and flips flag.
-- Then writes result_data + status='completed' + completed_at.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.ai_queue_complete_job(
  p_job_id        UUID,
  p_result_data   JSONB,
  p_output_log    JSONB,
  p_action_type   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id  UUID;
  v_credit_cost    INTEGER;
  v_credits_charged BOOLEAN;
  v_input_data     JSONB;
BEGIN
  SELECT restaurant_id, credit_cost, credits_charged, input_data
    INTO v_restaurant_id, v_credit_cost, v_credits_charged, v_input_data
  FROM public.ai_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND' USING ERRCODE = '02000';
  END IF;

  IF NOT v_credits_charged THEN
    PERFORM public.consume_ai_credits_with_job(
      v_restaurant_id, v_credit_cost, p_action_type,
      v_input_data, p_output_log, p_job_id
    );
    UPDATE public.ai_jobs SET credits_charged = true WHERE id = p_job_id;
  END IF;

  UPDATE public.ai_jobs
  SET status = 'completed',
      result_data = p_result_data,
      completed_at = now()
  WHERE id = p_job_id;

  RETURN jsonb_build_object('job_id', p_job_id, 'status', 'completed');
END;
$$;

REVOKE ALL ON FUNCTION public.ai_queue_complete_job(UUID, JSONB, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_queue_complete_job(UUID, JSONB, JSONB, TEXT) TO service_role;

COMMIT;
