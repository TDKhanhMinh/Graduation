-- Submission security primitives for the public submit-wish Edge Function.
-- The browser never receives access to these tables or functions directly.

CREATE TABLE private.wish_submission_rate_limits (
  scope text NOT NULL CHECK (scope IN ('event', 'ip', 'device')),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  key_hash text NOT NULL CHECK (char_length(key_hash) BETWEEN 1 AND 128),
  window_started_at timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 1 CHECK (hits > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, event_id, key_hash, window_started_at)
);

ALTER TABLE private.wish_submission_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.wish_submission_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON private.wish_submission_rate_limits
  TO service_role;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.consume_wish_rate_limit(
  p_scope text,
  p_event_id uuid,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_window_started_at timestamptz;
  v_hits integer;
  v_retry_after integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit configuration';
  END IF;

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch FROM pg_catalog.clock_timestamp()) / p_window_seconds
    ) * p_window_seconds
  );

  INSERT INTO private.wish_submission_rate_limits (
    scope,
    event_id,
    key_hash,
    window_started_at,
    hits,
    updated_at
  )
  VALUES (
    p_scope,
    p_event_id,
    p_key_hash,
    v_window_started_at,
    1,
    pg_catalog.clock_timestamp()
  )
  ON CONFLICT (scope, event_id, key_hash, window_started_at)
  DO UPDATE
  SET hits = private.wish_submission_rate_limits.hits + 1,
      updated_at = pg_catalog.clock_timestamp()
  RETURNING hits INTO v_hits;

  IF v_hits <= p_limit THEN
    RETURN 0;
  END IF;

  v_retry_after := greatest(
    1,
    pg_catalog.ceil(
      extract(
        epoch FROM (
          v_window_started_at
          + pg_catalog.make_interval(secs => p_window_seconds)
          - pg_catalog.clock_timestamp()
        )
      )
    )::integer
  );

  RETURN v_retry_after;
END;
$$;

REVOKE ALL ON FUNCTION private.consume_wish_rate_limit(
  text,
  uuid,
  text,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.consume_wish_rate_limit(
  text,
  uuid,
  text,
  integer,
  integer
) TO service_role;

CREATE OR REPLACE FUNCTION public.submit_wish_transaction(
  p_event_id uuid,
  p_client_request_id uuid,
  p_sender_name text,
  p_content text,
  p_ip_hash text,
  p_device_hash text,
  p_event_limit integer DEFAULT 300,
  p_ip_limit integer DEFAULT 10,
  p_device_limit integer DEFAULT 10,
  p_window_seconds integer DEFAULT 600
)
RETURNS TABLE (
  wish_id uuid,
  moderation_status text,
  created_at timestamptz,
  was_duplicate boolean,
  result_code text,
  retry_after_seconds integer,
  max_wish_length integer
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_existing public.wishes%ROWTYPE;
  v_wish public.wishes%ROWTYPE;
  v_status text;
  v_retry_after integer := 0;
  v_retry_candidate integer;
BEGIN
  -- Serialize matching idempotency keys before any abuse counters are consumed.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_event_id::text || ':' || p_client_request_id::text,
      0
    )
  );

  SELECT *
  INTO v_existing
  FROM public.wishes
  WHERE event_id = p_event_id
    AND client_request_id = p_client_request_id;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing.id,
      v_existing.moderation_status,
      v_existing.created_at,
      true,
      'OK'::text,
      0,
      NULL::integer;
    RETURN;
  END IF;

  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR SHARE;

  IF NOT FOUND OR v_event.visibility = 'private' THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      NULL::text,
      NULL::timestamptz,
      false,
      'EVENT_NOT_FOUND'::text,
      0,
      NULL::integer;
    RETURN;
  END IF;

  IF v_event.deleted_at IS NOT NULL OR v_event.archived_at IS NOT NULL THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      NULL::text,
      NULL::timestamptz,
      false,
      'EVENT_UNAVAILABLE'::text,
      0,
      v_event.max_wish_length;
    RETURN;
  END IF;

  IF v_event.submission_mode = 'closed' THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      NULL::text,
      NULL::timestamptz,
      false,
      'EVENT_CLOSED'::text,
      0,
      v_event.max_wish_length;
    RETURN;
  END IF;

  IF p_sender_name IS NULL
    OR pg_catalog.char_length(p_sender_name) NOT BETWEEN 1 AND 100
    OR p_content IS NULL
    OR pg_catalog.char_length(p_content) NOT BETWEEN 1 AND v_event.max_wish_length
    OR p_ip_hash IS NULL
    OR pg_catalog.char_length(p_ip_hash) NOT BETWEEN 1 AND 128
    OR p_device_hash IS NULL
    OR pg_catalog.char_length(p_device_hash) NOT BETWEEN 1 AND 128
  THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      NULL::text,
      NULL::timestamptz,
      false,
      'VALIDATION_ERROR'::text,
      0,
      v_event.max_wish_length;
    RETURN;
  END IF;

  v_retry_candidate := private.consume_wish_rate_limit(
    'event',
    p_event_id,
    'all',
    p_event_limit,
    p_window_seconds
  );
  v_retry_after := greatest(v_retry_after, v_retry_candidate);

  v_retry_candidate := private.consume_wish_rate_limit(
    'ip',
    p_event_id,
    p_ip_hash,
    p_ip_limit,
    p_window_seconds
  );
  v_retry_after := greatest(v_retry_after, v_retry_candidate);

  v_retry_candidate := private.consume_wish_rate_limit(
    'device',
    p_event_id,
    p_device_hash,
    p_device_limit,
    p_window_seconds
  );
  v_retry_after := greatest(v_retry_after, v_retry_candidate);

  IF v_retry_after > 0 THEN
    RETURN QUERY
    SELECT
      NULL::uuid,
      NULL::text,
      NULL::timestamptz,
      false,
      'RATE_LIMITED'::text,
      v_retry_after,
      v_event.max_wish_length;
    RETURN;
  END IF;

  v_status := CASE
    WHEN v_event.submission_mode = 'open' THEN 'approved'
    ELSE 'pending'
  END;

  INSERT INTO public.wishes (
    event_id,
    client_request_id,
    sender_name,
    content,
    moderation_status,
    is_pinned,
    approved_at
  )
  VALUES (
    p_event_id,
    p_client_request_id,
    p_sender_name,
    p_content,
    v_status,
    false,
    CASE WHEN v_status = 'approved' THEN pg_catalog.clock_timestamp() END
  )
  RETURNING * INTO v_wish;

  RETURN QUERY
  SELECT
    v_wish.id,
    v_wish.moderation_status,
    v_wish.created_at,
    false,
    'OK'::text,
    0,
    v_event.max_wish_length;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_wish_transaction(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_wish_transaction(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  integer
) TO service_role;
