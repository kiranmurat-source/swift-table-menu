-- ============================================================================
-- AI Queue: schema, RLS, enqueue/cancel RPCs, pgmq queue
-- Depends on: pgmq extension (PR0), is_super_admin() function
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. ai_jobs table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  job_type        TEXT NOT NULL
                    CHECK (job_type IN ('photo_enhance','description_writer','menu_import')),
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','processing','completed','failed','cancelled')),

  provider        TEXT
                    CHECK (provider IS NULL OR provider IN ('openai','gemini','anthropic')),

  input_data      JSONB NOT NULL,
  result_data     JSONB,
  error_message   TEXT,
  error_code      TEXT,

  attempt_count   INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL CHECK (max_attempts BETWEEN 1 AND 5),

  credit_cost     INTEGER NOT NULL CHECK (credit_cost > 0),
  credits_charged BOOLEAN NOT NULL DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status_type
  ON public.ai_jobs (status, job_type)
  WHERE status IN ('queued','processing');

CREATE INDEX IF NOT EXISTS idx_ai_jobs_restaurant_recent
  ON public.ai_jobs (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_active
  ON public.ai_jobs (user_id, status)
  WHERE status IN ('queued','processing');

-- Rate limit lookup index (last 60s per restaurant)
CREATE INDEX IF NOT EXISTS idx_ai_jobs_rate_limit
  ON public.ai_jobs (restaurant_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS — mirror ai_usage_log pattern but with is_super_admin()
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_jobs_select" ON public.ai_jobs;
CREATE POLICY "ai_jobs_select" ON public.ai_jobs
  FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
    OR public.is_super_admin()
  );

-- NO INSERT/UPDATE/DELETE policies for end users.
-- Inserts go through enqueue_ai_job RPC (SECURITY DEFINER).
-- Updates go through worker (service_role, bypasses RLS).
-- Cancels go through cancel_ai_job RPC (SECURITY DEFINER).
-- Service role bypasses RLS for all of the above.

-- ---------------------------------------------------------------------------
-- 3. ai_usage_log: add job_id for forensics
-- ---------------------------------------------------------------------------

ALTER TABLE public.ai_usage_log
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.ai_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_job
  ON public.ai_usage_log (job_id)
  WHERE job_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. enqueue_ai_job RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enqueue_ai_job(
  p_job_type   TEXT,
  p_input_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := auth.uid();
  v_restaurant_id  UUID;
  v_plan           TEXT;
  v_is_active      BOOLEAN;
  v_credits_total  INTEGER;
  v_credits_used   INTEGER;
  v_credits_remain INTEGER;
  v_image_count    INTEGER;
  v_credit_cost    INTEGER;
  v_max_attempts   INTEGER;
  v_provider       TEXT;
  v_rate_limit     INTEGER;
  v_recent_count   INTEGER;
  v_job_id         UUID;
  v_msg_id         BIGINT;
BEGIN
  -- Validate auth
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- Validate job_type
  IF p_job_type NOT IN ('photo_enhance','description_writer','menu_import') THEN
    RAISE EXCEPTION 'INVALID_JOB_TYPE: %', p_job_type USING ERRCODE = '22023';
  END IF;

  -- Resolve restaurant + lock for credit consistency
  SELECT p.restaurant_id, r.current_plan, r.is_active,
         r.ai_credits_total, r.ai_credits_used
    INTO v_restaurant_id, v_plan, v_is_active,
         v_credits_total, v_credits_used
  FROM public.profiles p
  JOIN public.restaurants r ON r.id = p.restaurant_id
  WHERE p.id = v_user_id
  FOR UPDATE OF r;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'NO_RESTAURANT_FOR_USER' USING ERRCODE = '02000';
  END IF;

  -- is_active gate (will broaden enforcement to Desc/Import — intentional)
  IF NOT v_is_active THEN
    RAISE EXCEPTION 'RESTAURANT_INACTIVE' USING ERRCODE = '23514';
  END IF;

  -- Compute cost
  IF p_job_type = 'photo_enhance' THEN
    v_credit_cost := 20;
    v_max_attempts := 3;
    v_provider := CASE WHEN v_plan = 'basic' THEN 'openai' ELSE 'gemini' END;

  ELSIF p_job_type = 'description_writer' THEN
    v_credit_cost := 15;
    v_max_attempts := 2;
    v_provider := 'anthropic';

  ELSIF p_job_type = 'menu_import' THEN
    v_image_count := COALESCE((p_input_data->>'image_count')::INTEGER, 0);
    IF v_image_count < 1 OR v_image_count > 10 THEN
      RAISE EXCEPTION 'INVALID_IMAGE_COUNT: % (must be 1-10)', v_image_count USING ERRCODE = '22023';
    END IF;
    v_credit_cost := v_image_count * 50;
    v_max_attempts := 1;
    v_provider := 'gemini';
  END IF;

  -- Credit balance pre-check (worker will RE-deduct atomically; this is fail-fast UX)
  v_credits_remain := v_credits_total - v_credits_used;
  IF v_credits_remain < v_credit_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: have %, need %', v_credits_remain, v_credit_cost
      USING ERRCODE = 'P0001';
  END IF;

  -- Per-plan rate limit (last 60 seconds)
  v_rate_limit := CASE v_plan
    WHEN 'basic' THEN 3
    WHEN 'premium' THEN 10
    WHEN 'enterprise' THEN 20
    ELSE 3
  END;

  SELECT count(*) INTO v_recent_count
  FROM public.ai_jobs
  WHERE restaurant_id = v_restaurant_id
    AND created_at > now() - interval '60 seconds';

  IF v_recent_count >= v_rate_limit THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: % jobs in last 60s (limit: %)', v_recent_count, v_rate_limit
      USING ERRCODE = 'P0001';
  END IF;

  -- Insert job
  INSERT INTO public.ai_jobs (
    restaurant_id, user_id, job_type, provider,
    input_data, max_attempts, credit_cost
  ) VALUES (
    v_restaurant_id, v_user_id, p_job_type, v_provider,
    p_input_data, v_max_attempts, v_credit_cost
  ) RETURNING id INTO v_job_id;

  -- Send to pgmq
  SELECT pgmq.send('ai_queue', jsonb_build_object('job_id', v_job_id, 'job_type', p_job_type))
    INTO v_msg_id;

  RETURN jsonb_build_object(
    'job_id', v_job_id,
    'status', 'queued',
    'credit_cost', v_credit_cost,
    'credits_remaining_after_charge', v_credits_remain - v_credit_cost,
    'msg_id', v_msg_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_ai_job(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_ai_job(TEXT, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. cancel_ai_job RPC (queued only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_ai_job(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_restaurant_id UUID;
  v_job_status    TEXT;
  v_job_restaurant UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  -- Lock the job row
  SELECT status, restaurant_id INTO v_job_status, v_job_restaurant
    FROM public.ai_jobs
    WHERE id = p_job_id
    FOR UPDATE;

  IF v_job_status IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND' USING ERRCODE = '02000';
  END IF;

  -- Ownership: must be on user's restaurant OR super_admin
  SELECT restaurant_id INTO v_restaurant_id FROM public.profiles WHERE id = v_user_id;
  IF v_job_restaurant <> v_restaurant_id AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  -- Only queued jobs can be cancelled
  IF v_job_status <> 'queued' THEN
    RAISE EXCEPTION 'CANNOT_CANCEL_STATUS: %', v_job_status USING ERRCODE = '22023';
  END IF;

  -- Mark cancelled. The worker will see status<>'queued' on next dequeue read
  -- and skip+delete the pgmq message. (Worker MUST check status before processing.)
  UPDATE public.ai_jobs
  SET status = 'cancelled',
      completed_at = now()
  WHERE id = p_job_id;

  RETURN jsonb_build_object('job_id', p_job_id, 'status', 'cancelled');
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_ai_job(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_ai_job(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. pgmq queue
-- ---------------------------------------------------------------------------

SELECT pgmq.create('ai_queue');

-- service_role already has full pgmq access by default in Supabase; no grants needed.

-- ---------------------------------------------------------------------------
-- 7. Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_jobs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_jobs';
  END IF;
END$$;

COMMIT;
