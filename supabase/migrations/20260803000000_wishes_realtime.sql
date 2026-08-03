-- 1. Create realtime_wall_events table
CREATE TABLE public.realtime_wall_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  wish_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('upsert', 'remove')),
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add indexes
CREATE INDEX idx_realtime_wall_event_time
  ON public.realtime_wall_events(event_id, created_at DESC);

-- 3. Enable RLS and add policies
ALTER TABLE public.realtime_wall_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to events for valid public events
CREATE POLICY "Public can read wall events" ON public.realtime_wall_events
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = realtime_wall_events.event_id
      AND e.deleted_at IS NULL
      AND e.archived_at IS NULL
      AND e.visibility IN ('public', 'unlisted')
  )
);

-- 4. Explicit Grants
GRANT SELECT ON public.realtime_wall_events TO anon, authenticated;
GRANT ALL ON public.realtime_wall_events TO service_role;

-- 5. Add to supabase_realtime publication
-- The publication 'supabase_realtime' usually exists, but we check/add
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'realtime_wall_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_wall_events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if publication doesn't exist
  RAISE NOTICE 'Could not add to supabase_realtime. Assuming it will be created later or ignoring.';
END $$;

-- 6. Trigger to populate events
CREATE OR REPLACE FUNCTION private.trg_wishes_realtime_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  old_status text;
  new_status text;
  is_approved boolean;
  was_approved boolean;
  safe_payload jsonb;
BEGIN
  -- Determine old and new status, considering deletions
  IF TG_OP = 'DELETE' THEN
    old_status := OLD.moderation_status;
    new_status := 'deleted';
    was_approved := (old_status = 'approved' AND OLD.deleted_at IS NULL);
    is_approved := false;
  ELSIF TG_OP = 'UPDATE' THEN
    old_status := OLD.moderation_status;
    new_status := NEW.moderation_status;
    was_approved := (old_status = 'approved' AND OLD.deleted_at IS NULL);
    is_approved := (new_status = 'approved' AND NEW.deleted_at IS NULL);
  ELSIF TG_OP = 'INSERT' THEN
    old_status := 'none';
    new_status := NEW.moderation_status;
    was_approved := false;
    is_approved := (new_status = 'approved' AND NEW.deleted_at IS NULL);
  END IF;

  -- Case 1: Wish becomes approved or is updated while approved (e.g. pinned)
  IF is_approved THEN
    safe_payload := jsonb_build_object(
      'id', NEW.id,
      'event_id', NEW.event_id,
      'sender_name', NEW.sender_name,
      'sender_avatar_path', NEW.sender_avatar_path,
      'content', NEW.content,
      'is_pinned', NEW.is_pinned,
      'created_at', NEW.created_at
    );
    INSERT INTO public.realtime_wall_events (event_id, wish_id, action, payload)
    VALUES (NEW.event_id, NEW.id, 'upsert', safe_payload);

  -- Case 2: Wish was approved but now is hidden, rejected, or deleted
  ELSIF was_approved AND NOT is_approved THEN
    INSERT INTO public.realtime_wall_events (event_id, wish_id, action)
    VALUES (OLD.event_id, OLD.id, 'remove');
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wish_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.wishes
FOR EACH ROW EXECUTE FUNCTION private.trg_wishes_realtime_event();
