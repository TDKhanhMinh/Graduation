-- Phase 2 public wall contract: expose only the allowlisted projection.
-- The view has fixed public-safe columns and event visibility predicates.
ALTER VIEW public.public_wishes_view SET (security_invoker = true);

-- Keep the view security-invoker so its reads remain subject to the caller's
-- RLS context. Anonymous callers receive only the columns required to build
-- the public DTO; sensitive base-table columns remain inaccessible.
REVOKE ALL ON public.events, public.wishes, public.wish_media FROM anon;
GRANT SELECT (id, deleted_at, archived_at, visibility)
  ON public.events TO anon;
GRANT SELECT (
    id, event_id, sender_name, sender_avatar_path, content,
    is_pinned, created_at, moderation_status, deleted_at
  ) ON public.wishes TO anon;
GRANT SELECT (
    wish_id, storage_path, media_type, mime_type,
    width, height, duration_ms
  ) ON public.wish_media TO anon;

DROP POLICY IF EXISTS "public can read public wall events" ON public.events;
CREATE POLICY "public can read public wall events" ON public.events
FOR SELECT TO anon
USING (
  deleted_at IS NULL
  AND archived_at IS NULL
  AND visibility IN ('public', 'unlisted')
);

DROP POLICY IF EXISTS "public can read approved public wall wishes" ON public.wishes;
CREATE POLICY "public can read approved public wall wishes" ON public.wishes
FOR SELECT TO anon
USING (
  moderation_status = 'approved'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id
      AND e.deleted_at IS NULL
      AND e.archived_at IS NULL
      AND e.visibility IN ('public', 'unlisted')
  )
);

DROP POLICY IF EXISTS "public can read approved media" ON public.wish_media;
CREATE POLICY "public can read approved media" ON public.wish_media
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.wishes w
    JOIN public.events e ON e.id = w.event_id
    WHERE w.id = wish_media.wish_id
      AND w.moderation_status = 'approved'
      AND w.deleted_at IS NULL
      AND e.deleted_at IS NULL
      AND e.archived_at IS NULL
      AND e.visibility IN ('public', 'unlisted')
  )
);
GRANT SELECT ON public.public_wishes_view TO anon, authenticated;

-- The media migration recreates this RPC, so restore the least-privilege
-- function grants for the current media-expanded signature.
DO $$
DECLARE
  submit_fn regprocedure;
BEGIN
  SELECT p.oid::regprocedure
  INTO submit_fn
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'submit_wish_transaction';

  IF submit_fn IS NULL THEN
    RAISE EXCEPTION 'submit_wish_transaction RPC is missing';
  END IF;

  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', submit_fn);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', submit_fn);
END;
$$;