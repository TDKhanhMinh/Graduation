-- Account lifecycle completion and event access boundary.
-- This migration supersedes the first hard-delete worker without rewriting
-- migration history. The worker only deletes auth.users after application data
-- has been claimed, cleaned up, and the cooling-off window has expired.

ALTER TABLE public.account_deletion_requests
  DROP CONSTRAINT IF EXISTS account_deletion_requests_status_check;

ALTER TABLE public.account_deletion_requests
  ADD CONSTRAINT account_deletion_requests_status_check
  CHECK (status IN ('cooling_off', 'cancelled', 'purging', 'purged'));

ALTER TABLE public.account_deletion_requests
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE TABLE IF NOT EXISTS public.account_deletion_snapshots (
  request_id uuid NOT NULL REFERENCES public.account_deletion_requests(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('event', 'wish')),
  entity_id uuid NOT NULL,
  previous_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS account_deletion_snapshots_entity_idx
  ON public.account_deletion_snapshots(entity_type, entity_id);

ALTER TABLE public.account_deletion_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_snapshots FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.account_deletion_snapshots TO service_role;

COMMENT ON TABLE public.account_deletion_snapshots IS
  'Internal restore journal for rows soft-deleted by one account deletion request.';

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

  SELECT e.owner_id
  INTO v_owner_id
  FROM public.events AS e
  WHERE e.id = p_event_id
    AND e.deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_owner_id = p_user_id THEN
    RETURN true;
  END IF;

  SELECT c.role
  INTO v_role
  FROM public.event_collaborators AS c
  WHERE c.event_id = p_event_id
    AND c.user_id = p_user_id;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  IF p_capability = 'event_read' THEN
    RETURN true;
  END IF;

  RETURN CASE v_role
    WHEN 'editor' THEN p_capability IN (
      'event_settings', 'moderation', 'media', 'poster',
      'export', 'insights', 'director', 'notifications'
    )
    WHEN 'moderator' THEN p_capability IN ('moderation', 'notifications')
    WHEN 'viewer' THEN p_capability IN ('insights', 'director')
    ELSE false
  END;
END;
$function$;

REVOKE ALL ON FUNCTION private.event_has_capability(uuid, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.event_has_capability(uuid, uuid, text)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "owners can read own events" ON public.events;
CREATE POLICY "members can read accessible events" ON public.events
FOR SELECT TO authenticated
USING (private.event_has_capability(id, (SELECT auth.uid()), 'event_read'));

DROP POLICY IF EXISTS "owners can read all event wishes" ON public.wishes;
CREATE POLICY "moderators can read event wishes" ON public.wishes
FOR SELECT TO authenticated
USING (private.event_has_capability(event_id, (SELECT auth.uid()), 'moderation'));

DROP POLICY IF EXISTS "owners can update own events" ON public.events;
CREATE POLICY "owners and editors can update event settings" ON public.events
FOR UPDATE TO authenticated
USING (private.event_has_capability(id, (SELECT auth.uid()), 'event_settings'))
WITH CHECK (private.event_has_capability(id, (SELECT auth.uid()), 'event_settings'));

CREATE OR REPLACE FUNCTION private.prevent_non_owner_event_control_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
BEGIN
  IF pg_catalog.current_setting('app.account_deletion_internal', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF v_user_id IS NOT NULL
     AND OLD.owner_id <> v_user_id
     AND (
       NEW.owner_id IS DISTINCT FROM OLD.owner_id
       OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     )
  THEN
    RAISE EXCEPTION 'EVENT_OWNER_CONTROL_REQUIRED' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.prevent_non_owner_event_control_changes() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_events_non_owner_control_guard ON public.events;
CREATE TRIGGER trg_events_non_owner_control_guard
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION private.prevent_non_owner_event_control_changes();

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_user_id uuid)
RETURNS TABLE (id uuid, status text, scheduled_for timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_USER_REQUIRED' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
    AND status IN ('cooling_off', 'purging')
  ORDER BY requested_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_request.id IS NOT NULL THEN
    RETURN QUERY SELECT v_request.id, v_request.status, v_request.scheduled_for;
    RETURN;
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, scheduled_for)
  VALUES (p_user_id, v_now + pg_catalog.make_interval(days => 30))
  RETURNING * INTO v_request;

  PERFORM pg_catalog.set_config('app.account_deletion_internal', 'on', true);

  INSERT INTO public.account_deletion_snapshots (request_id, entity_type, entity_id, previous_deleted_at)
  SELECT v_request.id, 'event', e.id, e.deleted_at
  FROM public.events AS e
  WHERE e.owner_id = p_user_id
    AND e.deleted_at IS NULL;

  INSERT INTO public.account_deletion_snapshots (request_id, entity_type, entity_id, previous_deleted_at)
  SELECT v_request.id, 'wish', w.id, w.deleted_at
  FROM public.wishes AS w
  WHERE w.deleted_at IS NULL
    AND (
      w.author_id = p_user_id
      OR EXISTS (
        SELECT 1
        FROM public.events AS e
        WHERE e.id = w.event_id
          AND e.owner_id = p_user_id
      )
    );

  UPDATE public.events
  SET deleted_at = v_now, updated_at = v_now
  WHERE owner_id = p_user_id
    AND deleted_at IS NULL;

  UPDATE public.wishes
  SET deleted_at = v_now, updated_at = v_now
  WHERE deleted_at IS NULL
    AND (
      author_id = p_user_id
      OR EXISTS (
        SELECT 1
        FROM public.events AS e
        WHERE e.id = wishes.event_id
          AND e.owner_id = p_user_id
      )
    );

  RETURN QUERY SELECT v_request.id, v_request.status, v_request.scheduled_for;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  SELECT * INTO v_request
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
    AND status = 'cooling_off'
  ORDER BY requested_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_request.id IS NULL OR v_request.scheduled_for <= v_now THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.set_config('app.account_deletion_internal', 'on', true);

  UPDATE public.events AS e
  SET deleted_at = s.previous_deleted_at,
      updated_at = v_now
  FROM public.account_deletion_snapshots AS s
  WHERE s.request_id = v_request.id
    AND s.entity_type = 'event'
    AND s.entity_id = e.id;

  UPDATE public.wishes AS w
  SET deleted_at = s.previous_deleted_at,
      updated_at = v_now
  FROM public.account_deletion_snapshots AS s
  WHERE s.request_id = v_request.id
    AND s.entity_type = 'wish'
    AND s.entity_id = w.id;

  UPDATE public.account_deletion_requests
  SET status = 'cancelled', cancelled_at = v_now, updated_at = v_now
  WHERE id = v_request.id;

  DELETE FROM public.account_deletion_snapshots
  WHERE request_id = v_request.id;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_account_deletion(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_account_deletion(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion(uuid) TO service_role;

CREATE OR REPLACE FUNCTION private.block_account_deletion_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
BEGIN
  IF pg_catalog.current_setting('app.account_deletion_internal', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'events' THEN
    v_user_id := COALESCE(NEW.owner_id, OLD.owner_id);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    v_user_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'wishes' THEN
    v_user_id := COALESCE(NEW.author_id, OLD.author_id);
    v_event_id := COALESCE(NEW.event_id, OLD.event_id);
    IF v_user_id IS NULL AND v_event_id IS NOT NULL THEN
      SELECT e.owner_id INTO v_user_id
      FROM public.events AS e
      WHERE e.id = v_event_id;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.account_deletion_requests AS r
    WHERE r.user_id = v_user_id
      AND r.status IN ('cooling_off', 'purging')
  ) THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_MUTATION_LOCKED' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.block_account_deletion_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_events_account_deletion_guard ON public.events;
CREATE TRIGGER trg_events_account_deletion_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION private.block_account_deletion_mutation();

DROP TRIGGER IF EXISTS trg_wishes_account_deletion_guard ON public.wishes;
CREATE TRIGGER trg_wishes_account_deletion_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.wishes
FOR EACH ROW EXECUTE FUNCTION private.block_account_deletion_mutation();

DROP TRIGGER IF EXISTS trg_profiles_account_deletion_guard ON public.profiles;
CREATE TRIGGER trg_profiles_account_deletion_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.block_account_deletion_mutation();

CREATE OR REPLACE FUNCTION private.process_hard_deletions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  r public.account_deletion_requests%ROWTYPE;
  v_count integer := 0;
  v_now timestamptz;
BEGIN
  FOR r IN
    SELECT *
    FROM public.account_deletion_requests
    WHERE status = 'cooling_off'
      AND scheduled_for <= pg_catalog.clock_timestamp()
      AND user_id IS NOT NULL
    ORDER BY scheduled_for, id
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      v_now := pg_catalog.clock_timestamp();

      UPDATE public.account_deletion_requests
      SET status = 'purging',
          started_at = v_now,
          attempts = attempts + 1,
          last_error = NULL,
          updated_at = v_now
      WHERE id = r.id;

      PERFORM pg_catalog.set_config('app.account_deletion_internal', 'on', true);

      DELETE FROM public.event_collaborators
      WHERE user_id = r.user_id OR invited_by = r.user_id;

      DELETE FROM public.event_invitations
      WHERE invited_by = r.user_id;

      DELETE FROM public.events
      WHERE owner_id = r.user_id;

      DELETE FROM public.wishes
      WHERE author_id = r.user_id;

      DELETE FROM auth.users
      WHERE id = r.user_id;

      UPDATE public.account_deletion_requests
      SET status = 'purged',
          purged_at = pg_catalog.clock_timestamp(),
          updated_at = pg_catalog.clock_timestamp(),
          user_id = NULL
      WHERE id = r.id;

      DELETE FROM public.account_deletion_snapshots
      WHERE request_id = r.id;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.account_deletion_requests
      SET status = 'cooling_off',
          last_error = pg_catalog.left(SQLERRM, 1000),
          updated_at = pg_catalog.clock_timestamp()
      WHERE id = r.id;
    END;
  END LOOP;

  RETURN v_count;
END;
$function$;

DO $migration$
BEGIN
  BEGIN
    PERFORM cron.unschedule('hard-delete-worker');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    PERFORM cron.schedule(
      'hard-delete-worker',
      '0 * * * *',
      'SELECT private.process_hard_deletions();'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'pg_cron could not be configured: %', SQLERRM;
  END;
END;
$migration$;

-- Allow collaborator roles to use the aggregate/read-only RPCs that the
-- application role matrix already exposes. The function bodies are patched
-- in-place so the migration remains compatible with the existing contracts.
DO $migration$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef(p.oid)
  INTO v_definition
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'moderate_wishes'
  LIMIT 1;

  IF v_definition IS NOT NULL THEN
    v_definition := pg_catalog.replace(
      v_definition,
      'e.owner_id = v_actor_id',
      'private.event_has_capability(e.id, v_actor_id, ''moderation'')'
    );
    EXECUTE v_definition;
  END IF;
END;
$migration$;

CREATE OR REPLACE FUNCTION public.get_event_insights(
  p_event_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz,
  p_timezone text,
  p_bucket text DEFAULT 'day'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_first_local timestamp;
  v_last_local timestamp;
  v_summary jsonb;
  v_media jsonb;
  v_reactions jsonb;
  v_trend jsonb;
BEGIN
  IF (SELECT auth.uid()) IS NULL
    OR NOT private.event_has_capability(p_event_id, (SELECT auth.uid()), 'insights')
  THEN
    RAISE EXCEPTION 'INSIGHTS_FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_range_start IS NULL OR p_range_end IS NULL
    OR p_range_end <= p_range_start
    OR p_range_end > p_range_start + interval '366 days'
  THEN
    RAISE EXCEPTION 'INSIGHTS_RANGE_INVALID' USING ERRCODE = '22023';
  END IF;

  IF p_bucket IS DISTINCT FROM 'day'
    OR p_timezone IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = p_timezone)
  THEN
    RAISE EXCEPTION 'INSIGHTS_BUCKET_OR_TIMEZONE_INVALID' USING ERRCODE = '22023';
  END IF;

  v_first_local := pg_catalog.date_trunc('day', p_range_start AT TIME ZONE p_timezone);
  v_last_local := pg_catalog.date_trunc('day', (p_range_end - interval '1 microsecond') AT TIME ZONE p_timezone);

  SELECT jsonb_build_object(
    'total', count(*)::bigint,
    'pending', count(*) FILTER (WHERE w.moderation_status = 'pending')::bigint,
    'approved', count(*) FILTER (WHERE w.moderation_status = 'approved')::bigint,
    'rejected', count(*) FILTER (WHERE w.moderation_status = 'rejected')::bigint,
    'hidden', count(*) FILTER (WHERE w.moderation_status = 'hidden')::bigint
  ) INTO v_summary
  FROM public.wishes AS w
  WHERE w.event_id = p_event_id AND w.deleted_at IS NULL
    AND w.created_at >= p_range_start AND w.created_at < p_range_end;

  SELECT jsonb_build_object(
    'total', count(*)::bigint,
    'image', count(*) FILTER (WHERE m.media_type = 'image')::bigint,
    'audio', count(*) FILTER (WHERE m.media_type = 'audio')::bigint
  ) INTO v_media
  FROM public.wish_media AS m
  JOIN public.wishes AS w ON w.id = m.wish_id
  WHERE w.event_id = p_event_id AND w.deleted_at IS NULL
    AND w.moderation_status IN ('pending', 'approved')
    AND m.processing_status = 'ready'
    AND m.created_at >= p_range_start AND m.created_at < p_range_end;

  WITH grouped AS (
    SELECT r.emoji, count(*)::bigint AS reaction_count
    FROM public.wish_reactions AS r
    JOIN public.wishes AS w ON w.id = r.wish_id
    WHERE w.event_id = p_event_id AND w.deleted_at IS NULL
      AND w.moderation_status = 'approved'
      AND r.created_at >= p_range_start AND r.created_at < p_range_end
    GROUP BY r.emoji
  )
  SELECT jsonb_build_object(
    'total', COALESCE((SELECT sum(g.reaction_count) FROM grouped AS g), 0)::bigint,
    'by_emoji', COALESCE((SELECT jsonb_object_agg(g.emoji, g.reaction_count) FROM grouped AS g), '{}'::jsonb)
  ) INTO v_reactions;

  WITH wish_daily AS (
    SELECT date_trunc('day', w.created_at AT TIME ZONE p_timezone) AS local_day,
      count(*)::bigint AS total,
      count(*) FILTER (WHERE w.moderation_status = 'pending')::bigint AS pending,
      count(*) FILTER (WHERE w.moderation_status = 'approved')::bigint AS approved,
      count(*) FILTER (WHERE w.moderation_status = 'rejected')::bigint AS rejected,
      count(*) FILTER (WHERE w.moderation_status = 'hidden')::bigint AS hidden
    FROM public.wishes AS w
    WHERE w.event_id = p_event_id AND w.deleted_at IS NULL
      AND w.created_at >= p_range_start AND w.created_at < p_range_end
    GROUP BY 1
  ), reaction_daily AS (
    SELECT date_trunc('day', r.created_at AT TIME ZONE p_timezone) AS local_day,
      count(*)::bigint AS reactions
    FROM public.wish_reactions AS r
    JOIN public.wishes AS w ON w.id = r.wish_id
    WHERE w.event_id = p_event_id AND w.deleted_at IS NULL
      AND w.moderation_status = 'approved'
      AND r.created_at >= p_range_start AND r.created_at < p_range_end
    GROUP BY 1
  ), buckets AS (
    SELECT generate_series(v_first_local, v_last_local, interval '1 day') AS local_day
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'bucket_start', b.local_day AT TIME ZONE p_timezone,
    'local_date', b.local_day::date,
    'total', COALESCE(w.total, 0)::bigint,
    'pending', COALESCE(w.pending, 0)::bigint,
    'approved', COALESCE(w.approved, 0)::bigint,
    'rejected', COALESCE(w.rejected, 0)::bigint,
    'hidden', COALESCE(w.hidden, 0)::bigint,
    'reactions', COALESCE(r.reactions, 0)::bigint
  ) ORDER BY b.local_day), '[]'::jsonb)
  INTO v_trend
  FROM buckets AS b
  LEFT JOIN wish_daily AS w ON w.local_day = b.local_day
  LEFT JOIN reaction_daily AS r ON r.local_day = b.local_day;

  RETURN jsonb_build_object(
    'schema_version', 1,
    'event_id', p_event_id,
    'range', jsonb_build_object('from', p_range_start, 'to', p_range_end, 'timezone', p_timezone, 'bucket', p_bucket),
    'summary', v_summary,
    'media', v_media,
    'reactions', v_reactions,
    'trend', v_trend
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_event_insights(uuid, timestamptz, timestamptz, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_event_insights(uuid, timestamptz, timestamptz, text, text)
  TO authenticated;

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
  SELECT pg_catalog.statement_timestamp(), e.id, e.slug, e.title, e.description,
    e.event_date, e.starts_at, e.ends_at, e.timezone, e.location_name,
    e.location_address, e.host_name, e.host_title, e.visibility, e.created_at,
    w.id, w.sender_name, w.content, w.is_pinned, w.created_at
  FROM public.events AS e
  LEFT JOIN public.wishes AS w ON w.event_id = e.id
    AND w.moderation_status = 'approved' AND w.deleted_at IS NULL
  WHERE e.id = p_event_id
    AND private.event_has_capability(e.id, (SELECT auth.uid()), 'export')
    AND e.deleted_at IS NULL
  ORDER BY w.created_at ASC NULLS LAST, w.id ASC NULLS LAST
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 901), 1), 901);
$function$;

REVOKE ALL ON FUNCTION public.get_owner_export_rows(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_export_rows(uuid, integer) TO authenticated;
