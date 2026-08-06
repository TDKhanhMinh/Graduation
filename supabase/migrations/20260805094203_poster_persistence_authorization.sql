-- Poster storage is deliberately separate from wish media. Poster assets are
-- private by default and are only addressable through owner-authorized flows.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS poster_quota_bytes bigint NOT NULL DEFAULT 104857600
    CHECK (poster_quota_bytes >= 0),
  ADD COLUMN IF NOT EXISTS poster_reserved_bytes bigint NOT NULL DEFAULT 0
    CHECK (poster_reserved_bytes >= 0),
  ADD COLUMN IF NOT EXISTS poster_usage_bytes bigint NOT NULL DEFAULT 0
    CHECK (poster_usage_bytes >= 0);

CREATE TABLE public.poster_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  document_version integer NOT NULL DEFAULT 1 CHECK (document_version > 0),
  template_id text NOT NULL CHECK (char_length(template_id) BETWEEN 1 AND 120),
  template_version integer NOT NULL CHECK (template_version > 0),
  ratio text NOT NULL CHECK (ratio IN ('4:5', '9:16', '1:1', '16:9')),
  document_json jsonb NOT NULL CHECK (jsonb_typeof(document_json) = 'object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  thumbnail_path text,
  export_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id),
  UNIQUE (id, event_id),
  CHECK (thumbnail_path IS NULL OR thumbnail_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$'),
  CHECK (export_path IS NULL OR export_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.png$')
);

CREATE INDEX idx_poster_documents_event_updated
  ON public.poster_documents(event_id, updated_at DESC);

CREATE TRIGGER trg_poster_documents_updated_at
BEFORE UPDATE ON public.poster_documents
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE public.poster_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  event_id uuid NOT NULL,
  asset_id text NOT NULL CHECK (char_length(asset_id) BETWEEN 1 AND 120),
  asset_role text NOT NULL CHECK (asset_role IN ('upload', 'thumbnail', 'export')),
  storage_bucket text NOT NULL DEFAULT 'poster-assets-private',
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  processing_status text NOT NULL DEFAULT 'ready'
    CHECK (processing_status IN ('uploading', 'ready', 'failed', 'quarantined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, asset_id),
  FOREIGN KEY (document_id, event_id)
    REFERENCES public.poster_documents(id, event_id) ON DELETE CASCADE,
  CHECK (storage_bucket = 'poster-assets-private'),
  CHECK (storage_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$')
);

CREATE INDEX idx_poster_assets_document ON public.poster_assets(document_id, created_at DESC);
CREATE INDEX idx_poster_assets_event ON public.poster_assets(event_id, created_at DESC);

CREATE TABLE public.poster_asset_upload_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  event_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'poster-assets-private',
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  max_size_bytes bigint NOT NULL CHECK (max_size_bytes BETWEEN 1 AND 10485760),
  reservation_bytes bigint GENERATED ALWAYS AS (max_size_bytes) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  UNIQUE (document_id, asset_id),
  FOREIGN KEY (document_id, event_id)
    REFERENCES public.poster_documents(id, event_id) ON DELETE CASCADE,
  CHECK (storage_bucket = 'poster-assets-private'),
  CHECK (storage_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$')
);

CREATE INDEX idx_poster_asset_upload_sessions_lookup
  ON public.poster_asset_upload_sessions(event_id, document_id, storage_path);

ALTER TABLE public.poster_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_asset_upload_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.poster_documents, public.poster_assets,
  public.poster_asset_upload_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poster_documents TO authenticated;
GRANT SELECT ON public.poster_assets TO authenticated;
GRANT ALL ON public.poster_documents, public.poster_assets,
  public.poster_asset_upload_sessions TO service_role;

CREATE POLICY "owners can read poster documents"
ON public.poster_documents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_documents.event_id
    AND e.owner_id = (SELECT auth.uid())
));

CREATE POLICY "owners can create poster documents"
ON public.poster_documents FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_documents.event_id
    AND e.owner_id = (SELECT auth.uid())
));

CREATE POLICY "owners can update poster documents"
ON public.poster_documents FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_documents.event_id
    AND e.owner_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_documents.event_id
    AND e.owner_id = (SELECT auth.uid())
));

CREATE POLICY "owners can delete poster documents"
ON public.poster_documents FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_documents.event_id
    AND e.owner_id = (SELECT auth.uid())
));

CREATE POLICY "owners can read poster assets"
ON public.poster_assets FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = poster_assets.event_id
    AND e.owner_id = (SELECT auth.uid())
));

CREATE FUNCTION public.create_poster_asset_upload_session(
  p_event_id uuid,
  p_document_id uuid,
  p_asset_id uuid,
  p_storage_path text,
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
  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.owner_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'POSTER_EVENT_FORBIDDEN';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.poster_documents d
    WHERE d.id = p_document_id AND d.event_id = p_event_id
  ) THEN
    RAISE EXCEPTION 'POSTER_DOCUMENT_NOT_FOUND';
  END IF;

  IF p_mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp')
    OR p_max_size_bytes NOT BETWEEN 1 AND 10485760
    OR p_expires_at <= pg_catalog.clock_timestamp()
    OR p_storage_path !~* (
      '^' || p_event_id::text || '/' || p_document_id::text || '/'
      || p_asset_id::text || '\\.(jpg|jpeg|png|webp)$'
    )
  THEN
    RAISE EXCEPTION 'POSTER_UPLOAD_CONTRACT_INVALID';
  END IF;

  UPDATE public.events
  SET poster_reserved_bytes = poster_reserved_bytes + p_max_size_bytes
  WHERE id = p_event_id
    AND poster_usage_bytes + poster_reserved_bytes + p_max_size_bytes <= poster_quota_bytes;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POSTER_QUOTA_EXCEEDED';
  END IF;

  INSERT INTO public.poster_asset_upload_sessions (
    document_id, event_id, asset_id, storage_path, mime_type,
    max_size_bytes, expires_at
  )
  VALUES (
    p_document_id, p_event_id, p_asset_id, p_storage_path, p_mime_type,
    p_max_size_bytes, p_expires_at
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'POSTER_UPLOAD_SESSION_EXISTS';
END;
$$;

REVOKE ALL ON FUNCTION public.create_poster_asset_upload_session(
  uuid, uuid, uuid, text, text, bigint, timestamptz
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_poster_asset_upload_session(
  uuid, uuid, uuid, text, text, bigint, timestamptz
) TO authenticated, service_role;

CREATE FUNCTION private.release_poster_upload_reservation()
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
    SET poster_reserved_bytes = GREATEST(poster_reserved_bytes - OLD.reservation_bytes, 0)
    WHERE id = OLD.event_id;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.release_poster_upload_reservation() FROM PUBLIC;

CREATE TRIGGER trg_release_poster_upload_reservation_delete
AFTER DELETE ON public.poster_asset_upload_sessions
FOR EACH ROW EXECUTE FUNCTION private.release_poster_upload_reservation();

CREATE TRIGGER trg_release_poster_upload_reservation_consume
AFTER UPDATE OF consumed_at ON public.poster_asset_upload_sessions
FOR EACH ROW
WHEN (OLD.consumed_at IS NULL AND NEW.consumed_at IS NOT NULL)
EXECUTE FUNCTION private.release_poster_upload_reservation();

CREATE FUNCTION private.apply_poster_asset_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events
    SET poster_usage_bytes = poster_usage_bytes + NEW.size_bytes
    WHERE id = NEW.event_id
      AND poster_usage_bytes + poster_reserved_bytes + NEW.size_bytes <= poster_quota_bytes;
    IF NOT FOUND THEN RAISE EXCEPTION 'POSTER_QUOTA_EXCEEDED'; END IF;
    RETURN NEW;
  END IF;

  UPDATE public.events
  SET poster_usage_bytes = GREATEST(poster_usage_bytes - OLD.size_bytes, 0)
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION private.apply_poster_asset_usage() FROM PUBLIC;

CREATE TRIGGER trg_apply_poster_asset_usage
AFTER INSERT OR DELETE ON public.poster_assets
FOR EACH ROW EXECUTE FUNCTION private.apply_poster_asset_usage();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'poster-assets-private',
  'poster-assets-private',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "owners can read poster objects"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'poster-assets-private'
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = split_part(storage.objects.name, '/', 1)
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "owners can upload poster objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'poster-assets-private'
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = split_part(storage.objects.name, '/', 1)
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "owners can update poster objects"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'poster-assets-private'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = split_part(storage.objects.name, '/', 1)
      AND e.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'poster-assets-private'
  AND name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$'
);

CREATE POLICY "owners can delete poster objects"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'poster-assets-private'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = split_part(storage.objects.name, '/', 1)
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE FUNCTION public.get_poster_assets_to_cleanup()
RETURNS TABLE (
  storage_path text,
  size_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
BEGIN
  DELETE FROM public.poster_asset_upload_sessions
  WHERE consumed_at IS NULL AND expires_at <= pg_catalog.now();

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
      SELECT 1 FROM public.poster_assets a
      WHERE a.storage_bucket = o.bucket_id AND a.storage_path = o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.poster_asset_upload_sessions s
      WHERE s.storage_bucket = o.bucket_id
        AND s.storage_path = o.name
        AND s.expires_at > pg_catalog.now()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_poster_assets_to_cleanup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_poster_assets_to_cleanup() TO service_role;
