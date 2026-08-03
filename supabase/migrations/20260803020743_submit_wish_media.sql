DROP FUNCTION IF EXISTS public.submit_wish_transaction;

CREATE OR REPLACE FUNCTION public.submit_wish_transaction(
  p_event_id uuid,
  p_client_request_id uuid,
  p_sender_name text,
  p_content text,
  p_ip_hash text,
  p_device_hash text,
  p_media_path text DEFAULT NULL,
  p_media_type text DEFAULT NULL,
  p_media_mime_type text DEFAULT NULL,
  p_media_size_bytes bigint DEFAULT NULL,
  p_media_duration_ms integer DEFAULT NULL,
  p_media_width integer DEFAULT NULL,
  p_media_height integer DEFAULT NULL,
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

  -- Insert media if provided
  IF p_media_path IS NOT NULL AND p_media_type IS NOT NULL AND p_media_mime_type IS NOT NULL AND p_media_size_bytes IS NOT NULL THEN
    INSERT INTO public.wish_media (
      wish_id,
      storage_bucket,
      storage_path,
      media_type,
      mime_type,
      size_bytes,
      width,
      height,
      duration_ms
    )
    VALUES (
      v_wish.id,
      'event-media-private',
      p_media_path,
      p_media_type,
      p_media_mime_type,
      p_media_size_bytes,
      p_media_width,
      p_media_height,
      p_media_duration_ms
    );
  END IF;

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

-- Also update public_wishes_view to include media
DROP VIEW IF EXISTS public.public_wishes_view;

CREATE VIEW public.public_wishes_view
WITH (security_invoker = true)
AS
SELECT
  w.id,
  w.event_id,
  w.sender_name,
  w.sender_avatar_path,
  w.content,
  w.is_pinned,
  w.created_at,
  (
    SELECT json_build_object(
      'path', m.storage_path,
      'type', m.media_type,
      'mime_type', m.mime_type,
      'width', m.width,
      'height', m.height,
      'duration_ms', m.duration_ms
    )
    FROM public.wish_media m
    WHERE m.wish_id = w.id
    LIMIT 1
  ) as media
FROM public.wishes w
JOIN public.events e ON e.id = w.event_id
WHERE w.moderation_status = 'approved'
  AND w.deleted_at IS NULL
  AND e.deleted_at IS NULL
  AND e.archived_at IS NULL
  AND e.visibility IN ('public', 'unlisted');

GRANT SELECT ON public.public_wishes_view TO service_role;
