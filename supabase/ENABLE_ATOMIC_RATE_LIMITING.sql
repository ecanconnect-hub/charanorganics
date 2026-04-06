-- Atomic rate-limit helper for app server routes.
-- Safe to re-run.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_rate_limit_atomic(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_window_ms INTEGER,
  p_max_requests INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.rate_limits%ROWTYPE;
  v_window_interval INTERVAL := (p_window_ms::TEXT || ' milliseconds')::INTERVAL;
BEGIN
  INSERT INTO public.rate_limits AS rl (
    identifier,
    endpoint,
    request_count,
    window_start
  )
  VALUES (
    p_identifier,
    p_endpoint,
    1,
    NOW()
  )
  ON CONFLICT (identifier, endpoint)
  DO UPDATE
  SET
    request_count = CASE
      WHEN rl.window_start <= NOW() - v_window_interval THEN 1
      ELSE rl.request_count + 1
    END,
    window_start = CASE
      WHEN rl.window_start <= NOW() - v_window_interval THEN NOW()
      ELSE rl.window_start
    END
  RETURNING rl.* INTO v_row;

  RETURN QUERY
  SELECT
    v_row.request_count <= p_max_requests AS allowed,
    GREATEST(p_max_requests - v_row.request_count, 0) AS remaining,
    v_row.window_start + v_window_interval AS reset_time;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit_atomic(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_atomic(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

COMMIT;

-- Optional verification:
-- SELECT * FROM public.check_rate_limit_atomic('127.0.0.1', '/api/report-issue', 60000, 5);
