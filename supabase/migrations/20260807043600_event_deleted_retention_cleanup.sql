-- Extend the existing retention pipeline to soft-deleted events.
-- The event row remains the parent until a separately approved hard-delete policy
-- exists, so child rows stay addressable for retention and audit purposes.
-- Cloudinary event.cover_path is a delivery URL; this pipeline deliberately does
-- not infer a public ID or destroy a cover without an explicit provider contract.

ALTER TABLE public.cleanup_run_logs
  ADD COLUMN IF NOT EXISTS event_deleted_assets_deleted_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_deleted_assets_deleted_bytes bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poster_assets_deleted_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poster_assets_deleted_bytes bigint NOT NULL DEFAULT 0;

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
  DELETE FROM public.media_upload_sessions s
  WHERE s.consumed_at IS NULL
    AND (
      s.expires_at <= pg_catalog.now()
      OR EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = s.event_id
          AND e.deleted_at IS NOT NULL
          AND e.deleted_at < pg_catalog.now() - interval '30 days'
      )
    );

  RETURN QUERY
  SELECT
    'orphan'::text,
    o.name,
    NULL::uuid,
    COALESCE(
      NULLIF(o.metadata ->> 'size', '')::bigint,
      NULLIF(o.metadata ->> 'contentLength', '')::bigint,
      0
    )
  FROM storage.objects o
  WHERE o.bucket_id = 'event-media-private'
    AND o.created_at < pg_catalog.now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1
      FROM public.wish_media m
      WHERE m.storage_bucket = o.bucket_id
        AND m.storage_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.wishes w
      WHERE w.sender_avatar_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.media_upload_sessions s
      WHERE s.storage_bucket = o.bucket_id
        AND s.storage_path = o.name
        AND s.expires_at > pg_catalog.now()
    );

  RETURN QUERY
  SELECT
    CASE
      WHEN e.deleted_at IS NOT NULL THEN 'event_deleted_media'::text
      ELSE 'rejected'::text
    END,
    m.storage_path,
    m.id,
    m.size_bytes
  FROM public.wish_media m
  JOIN public.wishes w ON w.id = m.wish_id
  JOIN public.events e ON e.id = w.event_id
  WHERE (
    (
      e.deleted_at IS NOT NULL
      AND e.deleted_at < pg_catalog.now() - interval '30 days'
    )
    OR (
      e.deleted_at IS NULL
      AND (w.moderation_status = 'rejected' OR w.deleted_at IS NOT NULL)
      AND w.updated_at < pg_catalog.now() - interval '30 days'
    )
  );

  RETURN QUERY
  SELECT
    'event_deleted_avatar'::text,
    o.name,
    NULL::uuid,
    COALESCE(
      NULLIF(o.metadata ->> 'size', '')::bigint,
      NULLIF(o.metadata ->> 'contentLength', '')::bigint,
      0
    )
  FROM storage.objects o
  WHERE o.bucket_id = 'event-media-private'
    AND o.created_at < pg_catalog.now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1
      FROM public.wish_media m
      WHERE m.storage_bucket = o.bucket_id
        AND m.storage_path = o.name
    )
    AND EXISTS (
      SELECT 1
      FROM public.wishes w
      JOIN public.events e ON e.id = w.event_id
      WHERE w.sender_avatar_path = o.name
        AND e.deleted_at IS NOT NULL
        AND e.deleted_at < pg_catalog.now() - interval '30 days'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_media_to_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_to_cleanup() TO service_role;

CREATE OR REPLACE FUNCTION public.get_poster_assets_to_cleanup()
RETURNS TABLE (
  storage_path text,
  size_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
BEGIN
  DELETE FROM public.poster_asset_upload_sessions s
  WHERE s.consumed_at IS NULL
    AND (
      s.expires_at <= pg_catalog.now()
      OR EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = s.event_id
          AND e.deleted_at IS NOT NULL
          AND e.deleted_at < pg_catalog.now() - interval '30 days'
      )
    );

  RETURN QUERY
  SELECT
    o.name,
    COALESCE(
      NULLIF(o.metadata ->> 'size', '')::bigint,
      NULLIF(o.metadata ->> 'contentLength', '')::bigint,
      0
    )
  FROM storage.objects o
  WHERE o.bucket_id = 'poster-assets-private'
    AND o.created_at < pg_catalog.now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1
      FROM public.poster_assets a
      WHERE a.storage_bucket = o.bucket_id
        AND a.storage_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.poster_asset_upload_sessions s
      WHERE s.storage_bucket = o.bucket_id
        AND s.storage_path = o.name
        AND s.expires_at > pg_catalog.now()
    );

  RETURN QUERY
  SELECT
    a.storage_path,
    a.size_bytes
  FROM public.poster_assets a
  JOIN public.poster_documents d ON d.id = a.document_id
  JOIN public.events e ON e.id = d.event_id
  WHERE e.deleted_at IS NOT NULL
    AND e.deleted_at < pg_catalog.now() - interval '30 days';
END;
$$;

REVOKE ALL ON FUNCTION public.get_poster_assets_to_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poster_assets_to_cleanup() TO service_role;
