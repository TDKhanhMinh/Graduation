-- Keep upload authorization and the stored object linked in one transaction.
CREATE TABLE public.media_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  client_request_id uuid NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'event-media-private',
  storage_path text NOT NULL UNIQUE,
  asset_role text NOT NULL CHECK (asset_role IN ('wish_media', 'sender_avatar')),
  media_type text NOT NULL CHECK (media_type IN ('image', 'audio')),
  mime_type text NOT NULL,
  max_size_bytes bigint NOT NULL CHECK (max_size_bytes > 0),
  reservation_bytes bigint GENERATED ALWAYS AS (max_size_bytes) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX media_upload_sessions_lookup
  ON public.media_upload_sessions(event_id, client_request_id, storage_path);

ALTER TABLE public.media_upload_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.media_upload_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_upload_sessions TO service_role;

ALTER TABLE public.events
  ADD COLUMN media_reserved_bytes bigint NOT NULL DEFAULT 0
  CHECK (media_reserved_bytes >= 0);

CREATE OR REPLACE FUNCTION public.create_media_upload_session(
  p_event_id uuid,
  p_client_request_id uuid,
  p_storage_bucket text,
  p_storage_path text,
  p_asset_role text,
  p_media_type text,
  p_mime_type text,
  p_max_size_bytes bigint,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  UPDATE public.events
  SET media_reserved_bytes = media_reserved_bytes + p_max_size_bytes
  WHERE id = p_event_id
    AND media_usage_bytes + media_reserved_bytes + p_max_size_bytes <= media_quota_bytes;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED';
  END IF;

  INSERT INTO public.media_upload_sessions (
    event_id,
    client_request_id,
    storage_bucket,
    storage_path,
    asset_role,
    media_type,
    mime_type,
    max_size_bytes,
    expires_at
  )
  VALUES (
    p_event_id,
    p_client_request_id,
    p_storage_bucket,
    p_storage_path,
    p_asset_role,
    p_media_type,
    p_mime_type,
    p_max_size_bytes,
    p_expires_at
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'MEDIA_UPLOAD_SESSION_EXISTS';
END;
$$;

REVOKE ALL ON FUNCTION public.create_media_upload_session(
  uuid, uuid, text, text, text, text, text, bigint, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_media_upload_session(
  uuid, uuid, text, text, text, text, text, bigint, timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION private.release_media_upload_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'DELETE'
    OR (OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL)
  THEN
    UPDATE public.events
    SET media_reserved_bytes = GREATEST(media_reserved_bytes - OLD.reservation_bytes, 0)
    WHERE id = OLD.event_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.release_media_upload_reservation() FROM PUBLIC;

CREATE TRIGGER trg_release_media_upload_reservation_delete
AFTER DELETE ON public.media_upload_sessions
FOR EACH ROW
EXECUTE FUNCTION private.release_media_upload_reservation();

CREATE TRIGGER trg_release_media_upload_reservation_consume
AFTER UPDATE OF consumed_at ON public.media_upload_sessions
FOR EACH ROW
WHEN (OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL)
EXECUTE FUNCTION private.release_media_upload_reservation();

CREATE OR REPLACE FUNCTION private.validate_wish_media_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  v_session public.media_upload_sessions%ROWTYPE;
  v_object storage.objects%ROWTYPE;
  v_actual_size bigint;
BEGIN
  SELECT *
  INTO v_session
  FROM public.media_upload_sessions
  WHERE event_id = (SELECT event_id FROM public.wishes WHERE id = NEW.wish_id)
    AND client_request_id = (
      SELECT client_request_id FROM public.wishes WHERE id = NEW.wish_id
    )
    AND storage_bucket = NEW.storage_bucket
    AND storage_path = NEW.storage_path
    AND asset_role = 'wish_media'
    AND expires_at > pg_catalog.clock_timestamp()
    AND consumed_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEDIA_UPLOAD_SESSION_INVALID';
  END IF;

  SELECT *
  INTO v_object
  FROM storage.objects
  WHERE bucket_id = NEW.storage_bucket
    AND name = NEW.storage_path;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEDIA_OBJECT_MISSING';
  END IF;

  IF v_session.media_type <> NEW.media_type
    OR pg_catalog.lower(v_session.mime_type) <> pg_catalog.lower(NEW.mime_type)
  THEN
    RAISE EXCEPTION 'MEDIA_METADATA_MISMATCH';
  END IF;

  v_actual_size := COALESCE(
    NULLIF(v_object.metadata ->> 'size', '')::bigint,
    NULLIF(v_object.metadata ->> 'contentLength', '')::bigint
  );
  IF v_actual_size IS NULL
    OR v_actual_size <> NEW.size_bytes
    OR v_actual_size > v_session.max_size_bytes
  THEN
    RAISE EXCEPTION 'MEDIA_SIZE_MISMATCH';
  END IF;

  UPDATE public.media_upload_sessions
  SET consumed_at = pg_catalog.clock_timestamp()
  WHERE id = v_session.id
    AND consumed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'MEDIA_UPLOAD_SESSION_CONSUMED';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.validate_sender_avatar_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  v_session public.media_upload_sessions%ROWTYPE;
  v_object storage.objects%ROWTYPE;
  v_actual_size bigint;
BEGIN
  IF NEW.sender_avatar_path IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
    AND NEW.sender_avatar_path IS NOT DISTINCT FROM OLD.sender_avatar_path
  THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_session
  FROM public.media_upload_sessions
  WHERE event_id = NEW.event_id
    AND client_request_id = NEW.client_request_id
    AND storage_bucket = 'event-media-private'
    AND storage_path = NEW.sender_avatar_path
    AND asset_role = 'sender_avatar'
    AND media_type = 'image'
    AND expires_at > pg_catalog.clock_timestamp()
    AND consumed_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AVATAR_UPLOAD_SESSION_INVALID';
  END IF;

  SELECT *
  INTO v_object
  FROM storage.objects
  WHERE bucket_id = v_session.storage_bucket
    AND name = v_session.storage_path;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AVATAR_MEDIA_OBJECT_MISSING';
  END IF;

  v_actual_size := COALESCE(
    NULLIF(v_object.metadata ->> 'size', '')::bigint,
    NULLIF(v_object.metadata ->> 'contentLength', '')::bigint
  );
  IF v_actual_size IS NULL OR v_actual_size > v_session.max_size_bytes THEN
    RAISE EXCEPTION 'AVATAR_MEDIA_SIZE_INVALID';
  END IF;

  UPDATE public.media_upload_sessions
  SET consumed_at = pg_catalog.clock_timestamp()
  WHERE id = v_session.id
    AND consumed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AVATAR_UPLOAD_SESSION_CONSUMED';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_wish_media_upload() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.validate_sender_avatar_upload() FROM PUBLIC;

CREATE TRIGGER trg_validate_wish_media_upload
BEFORE INSERT ON public.wish_media
FOR EACH ROW
EXECUTE FUNCTION private.validate_wish_media_upload();

CREATE TRIGGER trg_validate_sender_avatar_upload
BEFORE INSERT OR UPDATE OF sender_avatar_path ON public.wishes
FOR EACH ROW
EXECUTE FUNCTION private.validate_sender_avatar_upload();

-- The overload accepts the avatar path first, so the existing RPC remains
-- callable by older internal jobs while new submissions link the separate
-- avatar session in the same transaction.
CREATE OR REPLACE FUNCTION public.submit_wish_transaction(
  p_sender_avatar_path text,
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
  v_result record;
BEGIN
  SELECT *
  INTO v_result
  FROM public.submit_wish_transaction(
    p_event_id => p_event_id,
    p_client_request_id => p_client_request_id,
    p_sender_name => p_sender_name,
    p_content => p_content,
    p_ip_hash => p_ip_hash,
    p_device_hash => p_device_hash,
    p_media_path => p_media_path,
    p_media_type => p_media_type,
    p_media_mime_type => p_media_mime_type,
    p_media_size_bytes => p_media_size_bytes,
    p_media_duration_ms => p_media_duration_ms,
    p_media_width => p_media_width,
    p_media_height => p_media_height,
    p_event_limit => p_event_limit,
    p_ip_limit => p_ip_limit,
    p_device_limit => p_device_limit,
    p_window_seconds => p_window_seconds
  );

  IF v_result.wish_id IS NOT NULL
    AND v_result.was_duplicate IS NOT TRUE
    AND p_sender_avatar_path IS NOT NULL
  THEN
    UPDATE public.wishes
    SET sender_avatar_path = p_sender_avatar_path
    WHERE id = v_result.wish_id;
  END IF;

  RETURN QUERY
  SELECT
    v_result.wish_id,
    v_result.moderation_status,
    v_result.created_at,
    v_result.was_duplicate,
    v_result.result_code,
    v_result.retry_after_seconds,
    v_result.max_wish_length;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_wish_transaction(
  text, uuid, uuid, text, text, text, text, text, text, text, bigint,
  integer, integer, integer, integer, integer, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_wish_transaction(
  text, uuid, uuid, text, text, text, text, text, text, text, bigint,
  integer, integer, integer, integer, integer, integer, integer
) TO service_role;

REVOKE ALL ON FUNCTION public.get_media_to_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_to_cleanup() TO service_role;
REVOKE ALL ON FUNCTION public.update_event_media_usage() FROM PUBLIC, anon, authenticated;

-- Keep linked avatars and unexpired sessions out of orphan cleanup.
CREATE OR REPLACE FUNCTION public.get_media_to_cleanup()
RETURNS TABLE (
  cleanup_type text,
  storage_path text,
  media_id uuid,
  size_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
BEGIN
  DELETE FROM public.media_upload_sessions
  WHERE consumed_at IS NULL
    AND expires_at <= pg_catalog.now();

  RETURN QUERY
  SELECT
    'orphan'::text,
    o.name,
    NULL::uuid,
    COALESCE(NULLIF(o.metadata->>'size', '')::bigint, NULLIF(o.metadata->>'contentLength', '')::bigint, 0)
  FROM storage.objects o
  WHERE o.bucket_id = 'event-media-private'
    AND o.created_at < pg_catalog.now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.wish_media m
      WHERE m.storage_bucket = o.bucket_id AND m.storage_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.sender_avatar_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.media_upload_sessions s
      WHERE s.storage_bucket = o.bucket_id
        AND s.storage_path = o.name
        AND s.expires_at > pg_catalog.now()
    );

  RETURN QUERY
  SELECT
    'rejected'::text,
    m.storage_path,
    m.id,
    m.size_bytes
  FROM public.wish_media m
  JOIN public.wishes w ON m.wish_id = w.id
  WHERE (w.moderation_status = 'rejected' OR w.deleted_at IS NOT NULL)
    AND w.updated_at < pg_catalog.now() - interval '30 days';
END;
$$;

REVOKE ALL ON FUNCTION public.get_media_to_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_to_cleanup() TO service_role;
