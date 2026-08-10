-- RM26 P3-T03: event-scoped Director sessions with monotonic snapshots.

CREATE TABLE public.director_sessions (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  last_command_sequence bigint NOT NULL DEFAULT 0 CHECK (last_command_sequence >= 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  display_token_hash text NOT NULL CHECK (display_token_hash ~ '^[a-f0-9]{64}$'),
  display_token_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX director_sessions_one_active_event
  ON public.director_sessions(event_id)
  WHERE status = 'active';

CREATE INDEX director_sessions_owner_idx
  ON public.director_sessions(owner_id, created_at DESC);

ALTER TABLE public.director_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.director_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.director_sessions TO authenticated;
GRANT ALL ON public.director_sessions TO service_role;

CREATE POLICY director_sessions_owner_read
ON public.director_sessions
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = owner_id);

CREATE OR REPLACE FUNCTION private.broadcast_director_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'director-session:' || NEW.id::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.broadcast_director_session() FROM PUBLIC;

CREATE TRIGGER trg_director_sessions_updated_at
BEFORE UPDATE ON public.director_sessions
FOR EACH ROW
EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER trg_director_sessions_broadcast
AFTER UPDATE ON public.director_sessions
FOR EACH ROW
WHEN (OLD.version IS DISTINCT FROM NEW.version OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION private.broadcast_director_session();

CREATE POLICY director_session_owner_receive
ON realtime.messages
FOR SELECT TO authenticated
USING (
  split_part(realtime.topic(), ':', 1) = 'director-session'
  AND EXISTS (
    SELECT 1
    FROM public.director_sessions AS session_row
    WHERE session_row.id::text = split_part(realtime.topic(), ':', 2)
      AND session_row.owner_id = (SELECT auth.uid())
      AND session_row.status = 'active'
  )
);

CREATE OR REPLACE FUNCTION public.create_director_session(
  p_session_id uuid,
  p_event_id uuid,
  p_owner_id uuid,
  p_display_token_hash text,
  p_display_token_expires_at timestamptz,
  p_snapshot jsonb
)
RETURNS TABLE (id uuid, version bigint, snapshot jsonb, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_display_token_hash !~ '^[a-f0-9]{64}$'
     OR p_display_token_expires_at <= now()
     OR (p_snapshot->>'eventId') IS DISTINCT FROM p_event_id::text
     OR (p_snapshot->>'sessionId') IS DISTINCT FROM p_session_id::text
  THEN
    RAISE EXCEPTION 'DIRECTOR_SESSION_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.events AS event_row
    WHERE event_row.id = p_event_id
      AND event_row.owner_id = p_owner_id
      AND event_row.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'DIRECTOR_SESSION_NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  UPDATE public.director_sessions
  SET status = 'closed', updated_at = now()
  WHERE event_id = p_event_id AND status = 'active';

  INSERT INTO public.director_sessions (
    id, event_id, owner_id, snapshot, display_token_hash, display_token_expires_at
  )
  VALUES (
    p_session_id, p_event_id, p_owner_id, p_snapshot, p_display_token_hash, p_display_token_expires_at
  );

  RETURN QUERY
  SELECT session_row.id, session_row.version, session_row.snapshot, session_row.created_at
  FROM public.director_sessions AS session_row
  WHERE session_row.id = p_session_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_director_session(uuid, uuid, uuid, text, timestamptz, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_director_session(uuid, uuid, uuid, text, timestamptz, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.get_director_display_session(
  p_session_id uuid,
  p_display_token_hash text
)
RETURNS TABLE (event_id uuid, version bigint, snapshot jsonb, updated_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT session_row.event_id, session_row.version, session_row.snapshot, session_row.updated_at
  FROM public.director_sessions AS session_row
  WHERE session_row.id = p_session_id
    AND session_row.status = 'active'
    AND session_row.display_token_hash = p_display_token_hash
    AND session_row.display_token_expires_at > now();
$function$;

REVOKE ALL ON FUNCTION public.get_director_display_session(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_director_display_session(uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.apply_director_snapshot(
  p_session_id uuid,
  p_owner_id uuid,
  p_expected_version bigint,
  p_sequence bigint,
  p_snapshot jsonb
)
RETURNS TABLE (applied boolean, version bigint, snapshot jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_row public.director_sessions%ROWTYPE;
BEGIN
  SELECT * INTO current_row
  FROM public.director_sessions
  WHERE id = p_session_id AND owner_id = p_owner_id AND status = 'active';

  IF current_row.id IS NULL THEN
    RAISE EXCEPTION 'DIRECTOR_SESSION_NOT_ALLOWED' USING ERRCODE = '42501';
  END IF;

  IF (p_snapshot->>'sessionId') IS DISTINCT FROM p_session_id::text
     OR (p_snapshot->>'eventId') IS DISTINCT FROM current_row.event_id::text
  THEN
    RAISE EXCEPTION 'DIRECTOR_SESSION_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  IF p_sequence <= current_row.last_command_sequence OR p_expected_version <> current_row.version THEN
    RETURN QUERY SELECT false, current_row.version, current_row.snapshot;
    RETURN;
  END IF;

  UPDATE public.director_sessions AS session_row
  SET version = session_row.version + 1,
      last_command_sequence = p_sequence,
      snapshot = p_snapshot,
      updated_at = now()
  WHERE session_row.id = p_session_id
    AND session_row.version = p_expected_version
    AND session_row.last_command_sequence < p_sequence;

  RETURN QUERY
  SELECT true, session_row.version, session_row.snapshot
  FROM public.director_sessions AS session_row
  WHERE session_row.id = p_session_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_director_snapshot(uuid, uuid, bigint, bigint, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_director_snapshot(uuid, uuid, bigint, bigint, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.close_director_session(p_session_id uuid, p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH closed AS (
    UPDATE public.director_sessions
    SET status = 'closed', updated_at = now()
    WHERE id = p_session_id AND owner_id = p_owner_id AND status = 'active'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM closed);
$function$;

REVOKE ALL ON FUNCTION public.close_director_session(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_director_session(uuid, uuid)
  TO service_role;

DO $migration$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.director_sessions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END;
$migration$;
