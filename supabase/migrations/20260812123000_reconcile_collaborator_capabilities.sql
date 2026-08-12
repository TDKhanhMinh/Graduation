-- Keep the database capability contract aligned with the audited dashboard
-- surfaces. Poster, Director, Sharing and Notifications remain owner-only
-- until their storage/realtime mutation boundaries are migrated separately.

CREATE OR REPLACE FUNCTION private.event_has_capability(
  p_event_id uuid,
  p_user_id uuid,
  p_capability text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_owner_id uuid;
  v_role text;
BEGIN
  IF p_event_id IS NULL OR p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT e.owner_id INTO v_owner_id
  FROM public.events AS e
  WHERE e.id = p_event_id AND e.deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_owner_id = p_user_id THEN
    RETURN true;
  END IF;

  SELECT c.role INTO v_role
  FROM public.event_collaborators AS c
  WHERE c.event_id = p_event_id AND c.user_id = p_user_id;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN CASE
    WHEN p_capability = 'event_read' THEN true
    WHEN v_role = 'editor' THEN p_capability IN ('event_settings', 'moderation', 'export', 'insights')
    WHEN v_role = 'moderator' THEN p_capability = 'moderation'
    WHEN v_role = 'viewer' THEN p_capability = 'insights'
    ELSE false
  END;
END;
$function$;

REVOKE ALL ON FUNCTION private.event_has_capability(uuid, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.event_has_capability(uuid, uuid, text)
  TO authenticated, service_role;
