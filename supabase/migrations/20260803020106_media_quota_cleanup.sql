-- 1. Add quota and usage columns to events table
ALTER TABLE public.events 
  ADD COLUMN media_quota_bytes bigint NOT NULL DEFAULT 524288000, -- 500MB
  ADD COLUMN media_usage_bytes bigint NOT NULL DEFAULT 0;

-- 2. Create cleanup_run_logs table
CREATE TABLE public.cleanup_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_started_at timestamptz NOT NULL DEFAULT now(),
  run_ended_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  orphans_deleted_count integer NOT NULL DEFAULT 0,
  orphans_deleted_bytes bigint NOT NULL DEFAULT 0,
  rejected_deleted_count integer NOT NULL DEFAULT 0,
  rejected_deleted_bytes bigint NOT NULL DEFAULT 0,
  error_details text
);

ALTER TABLE public.cleanup_run_logs ENABLE ROW LEVEL SECURITY;
-- No public access. Only service_role can access.
REVOKE ALL ON public.cleanup_run_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cleanup_run_logs TO service_role;

-- 3. Trigger to calculate media usage bytes for events
CREATE OR REPLACE FUNCTION public.update_event_media_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_event_id uuid;
  v_size_diff bigint := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the event_id from the related wish
    SELECT event_id INTO v_event_id FROM public.wishes WHERE id = NEW.wish_id;
    v_size_diff := NEW.size_bytes;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT event_id INTO v_event_id FROM public.wishes WHERE id = OLD.wish_id;
    v_size_diff := -OLD.size_bytes;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT event_id INTO v_event_id FROM public.wishes WHERE id = NEW.wish_id;
    v_size_diff := NEW.size_bytes - OLD.size_bytes;
  END IF;

  IF v_event_id IS NOT NULL AND v_size_diff != 0 THEN
    UPDATE public.events 
    SET media_usage_bytes = media_usage_bytes + v_size_diff 
    WHERE id = v_event_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. RPC to find media to cleanup
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
  -- 1. Find orphans (in storage but not in wish_media, older than 24h)
  RETURN QUERY
  SELECT 
    'orphan'::text AS cleanup_type,
    o.name AS storage_path,
    NULL::uuid AS media_id,
    COALESCE(o.metadata->>'size', '0')::bigint AS size_bytes
  FROM storage.objects o
  WHERE o.bucket_id = 'event-media-private'
    AND o.created_at < now() - interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.wish_media m WHERE m.storage_path = o.name
    );

  -- 2. Find rejected/deleted (in wish_media but wish is rejected/deleted, older than 30d)
  RETURN QUERY
  SELECT 
    'rejected'::text AS cleanup_type,
    m.storage_path,
    m.id AS media_id,
    m.size_bytes
  FROM public.wish_media m
  JOIN public.wishes w ON m.wish_id = w.id
  WHERE (w.moderation_status = 'rejected' OR w.deleted_at IS NOT NULL)
    AND w.updated_at < now() - interval '30 days';
END;
$$;

CREATE TRIGGER trg_wish_media_usage
AFTER INSERT OR UPDATE OF size_bytes OR DELETE
ON public.wish_media
FOR EACH ROW
EXECUTE FUNCTION public.update_event_media_usage();
