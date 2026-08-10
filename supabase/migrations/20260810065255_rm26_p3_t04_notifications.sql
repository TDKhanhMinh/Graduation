-- RM26 P3-T04: owner-first pending-wish notifications.
-- The trigger is the durable producer boundary. Payloads carry no wish content,
-- media URL, actor hash or IP data.

CREATE TABLE public.notification_preferences (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  pending_wish_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, event_id)
);

CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind = 'pending_wish'),
  dedupe_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  UNIQUE (recipient_id, event_id, wish_id, kind)
);

CREATE INDEX idx_notification_events_recipient
  ON public.notification_events(recipient_id, event_id, created_at DESC);
CREATE INDEX idx_notification_events_unread
  ON public.notification_events(recipient_id, event_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX idx_notification_events_expiry
  ON public.notification_events(expires_at);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notification_preferences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.notification_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notification_events TO service_role;

CREATE POLICY owners_read_notification_preferences
ON public.notification_preferences
FOR SELECT TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = notification_preferences.event_id
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY owners_read_notification_events
ON public.notification_events
FOR SELECT TO authenticated
USING (
  recipient_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = notification_events.event_id
      AND e.owner_id = (SELECT auth.uid())
  )
);

-- Private Realtime channel authorization is separate from table RLS.
DROP POLICY IF EXISTS event_owners_receive_notification_channels
  ON realtime.messages;
CREATE POLICY event_owners_receive_notification_channels
ON realtime.messages
FOR SELECT TO authenticated
USING (
  split_part(realtime.topic(), ':', 1) = 'notification-events'
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = split_part(realtime.topic(), ':', 2)
      AND e.owner_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION private.enqueue_pending_wish_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
  v_enabled boolean;
  v_dedupe_key text;
BEGIN
  IF NOT (
    (TG_OP = 'INSERT' AND NEW.moderation_status = 'pending')
    OR (
      TG_OP = 'UPDATE'
      AND OLD.moderation_status IS DISTINCT FROM NEW.moderation_status
      AND NEW.moderation_status = 'pending'
    )
  ) THEN
    RETURN NEW;
  END IF;

  SELECT e.owner_id INTO v_owner_id
  FROM public.events e
  WHERE e.id = NEW.event_id AND e.deleted_at IS NULL;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.pending_wish_enabled INTO v_enabled
  FROM public.notification_preferences p
  WHERE p.owner_id = v_owner_id AND p.event_id = NEW.event_id;

  IF COALESCE(v_enabled, true) THEN
    v_dedupe_key := 'pending-wish:' || v_owner_id::text || ':'
      || NEW.event_id::text || ':' || NEW.id::text;

    INSERT INTO public.notification_events (
      recipient_id, event_id, wish_id, kind, dedupe_key, payload
    )
    VALUES (
      v_owner_id, NEW.event_id, NEW.id, 'pending_wish', v_dedupe_key,
      jsonb_build_object('type', 'pending_wish')
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_pending_wish_notification()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER trg_wishes_pending_notification
AFTER INSERT OR UPDATE OF moderation_status ON public.wishes
FOR EACH ROW EXECUTE FUNCTION private.enqueue_pending_wish_notification();

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_updated boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'NOTIFICATION_NOT_ALLOWED';
  END IF;

  UPDATE public.notification_events n
  SET read_at = COALESCE(n.read_at, pg_catalog.clock_timestamp())
  WHERE n.id = p_notification_id
    AND n.recipient_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = n.event_id AND e.owner_id = (SELECT auth.uid())
    );

  v_updated := FOUND;
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'NOTIFICATION_NOT_ALLOWED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.owner_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'NOTIFICATION_NOT_ALLOWED';
  END IF;

  UPDATE public.notification_events n
  SET read_at = pg_catalog.clock_timestamp()
  WHERE n.event_id = p_event_id
    AND n.recipient_id = (SELECT auth.uid())
    AND n.read_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = n.event_id AND e.owner_id = (SELECT auth.uid())
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_notification_preferences(
  p_event_id uuid,
  p_pending_wish_enabled boolean
)
RETURNS public.notification_preferences
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid := (SELECT auth.uid());
  v_preferences public.notification_preferences;
BEGIN
  IF v_owner_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.owner_id = v_owner_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'NOTIFICATION_NOT_ALLOWED';
  END IF;

  INSERT INTO public.notification_preferences (
    owner_id, event_id, pending_wish_enabled
  )
  VALUES (v_owner_id, p_event_id, p_pending_wish_enabled)
  ON CONFLICT (owner_id, event_id)
  DO UPDATE SET
    pending_wish_enabled = EXCLUDED.pending_wish_enabled,
    updated_at = pg_catalog.clock_timestamp()
  RETURNING * INTO v_preferences;

  RETURN v_preferences;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_notification_events()
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.notification_events
  WHERE expires_at <= pg_catalog.clock_timestamp();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_notification_preferences(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_notification_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_notification_preferences(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_notification_events() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notification_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add notification_events to supabase_realtime.';
END $$;

COMMENT ON TABLE public.notification_events IS
  'Owner-only pending-wish notifications with a non-sensitive type payload.';
COMMENT ON TABLE public.notification_preferences IS
  'Owner-only in-app preferences; vendor email and push are out of scope.';
