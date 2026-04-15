-- ==========================================================================
-- AI Credits v2: atomik düşüm + plan bazlı kredi tanımları (Basic=60,
-- Premium=150, Enterprise=300 / yıl). Menu description için de ai_credits
-- sistemi kullanılıyor (eski ai_usage_count bırakıldı geriye dönük).
-- ==========================================================================

-- Plan bazlı default'ları backfill et
UPDATE restaurants SET ai_credits_total = 60
  WHERE LOWER(COALESCE(current_plan, '')) IN ('basic')
    AND COALESCE(ai_credits_total, 0) < 60;
UPDATE restaurants SET ai_credits_total = 150
  WHERE LOWER(COALESCE(current_plan, '')) IN ('premium', 'pro')
    AND COALESCE(ai_credits_total, 0) < 150;
UPDATE restaurants SET ai_credits_total = 300
  WHERE LOWER(COALESCE(current_plan, '')) IN ('enterprise')
    AND COALESCE(ai_credits_total, 0) < 300;

-- Atomik kredi tüketme RPC'si
CREATE OR REPLACE FUNCTION consume_ai_credits(
  p_restaurant_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_input JSONB DEFAULT '{}'::jsonb,
  p_output JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (credits_used INTEGER, credits_total INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
  v_new_used INTEGER;
BEGIN
  SELECT COALESCE(ai_credits_total, 0), COALESCE(ai_credits_used, 0)
    INTO v_total, v_used
    FROM restaurants
    WHERE id = p_restaurant_id
    FOR UPDATE;

  IF v_total - v_used < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  v_new_used := v_used + p_amount;

  UPDATE restaurants
    SET ai_credits_used = v_new_used
    WHERE id = p_restaurant_id;

  INSERT INTO ai_usage_log (restaurant_id, action_type, credits_used, input_data, output_data)
    VALUES (p_restaurant_id, p_action_type, p_amount, p_input, p_output);

  credits_used := v_new_used;
  credits_total := v_total;
  RETURN NEXT;
END $$;

GRANT EXECUTE ON FUNCTION consume_ai_credits(UUID, INTEGER, TEXT, JSONB, JSONB) TO authenticated, service_role;
