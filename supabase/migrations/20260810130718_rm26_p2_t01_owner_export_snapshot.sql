-- RM26 P2-T01: bounded owner-only export rows.
-- The function is SECURITY INVOKER so RLS remains active; the explicit owner
-- predicate is defense in depth against direct RPC use and ID guessing.

CREATE OR REPLACE FUNCTION public.get_owner_export_rows(
  p_event_id uuid,
  p_limit integer DEFAULT 901
)
RETURNS TABLE (
  snapshot_at timestamptz,
  event_id uuid,
  event_slug text,
  event_title text,
  event_description text,
  event_date timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  location_name text,
  location_address text,
  host_name text,
  host_title text,
  visibility text,
  event_created_at timestamptz,
  wish_id uuid,
  sender_name text,
  wish_content text,
  is_pinned boolean,
  wish_created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT
    pg_catalog.statement_timestamp(),
    e.id,
    e.slug,
    e.title,
    e.description,
    e.event_date,
    e.starts_at,
    e.ends_at,
    e.timezone,
    e.location_name,
    e.location_address,
    e.host_name,
    e.host_title,
    e.visibility,
    e.created_at,
    w.id,
    w.sender_name,
    w.content,
    w.is_pinned,
    w.created_at
  FROM public.events AS e
  LEFT JOIN public.wishes AS w
    ON w.event_id = e.id
    AND w.moderation_status = 'approved'
    AND w.deleted_at IS NULL
  WHERE e.id = p_event_id
    AND e.owner_id = (SELECT auth.uid())
    AND e.deleted_at IS NULL
  ORDER BY w.created_at ASC NULLS LAST, w.id ASC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 901), 1), 901);
$function$;

COMMENT ON FUNCTION public.get_owner_export_rows(uuid, integer)
  IS 'Returns a bounded, owner-authorized export projection at one statement consistency point. It excludes identity, moderation, storage and secret fields.';

REVOKE ALL ON FUNCTION public.get_owner_export_rows(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_export_rows(uuid, integer) TO authenticated;
