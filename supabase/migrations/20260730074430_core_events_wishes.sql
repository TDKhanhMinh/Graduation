-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create server-only updated_at trigger function
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$;

REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC;

-- 3. Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text,
  cover_path text,
  theme_key text NOT NULL DEFAULT 'graduation',
  event_date timestamptz,
  visibility text NOT NULL DEFAULT 'unlisted'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  submission_mode text NOT NULL DEFAULT 'approval_required'
    CHECK (submission_mode IN ('open', 'approval_required', 'closed')),
  allow_images boolean NOT NULL DEFAULT true,
  allow_audio boolean NOT NULL DEFAULT true,
  allow_ai boolean NOT NULL DEFAULT true,
  max_wish_length integer NOT NULL DEFAULT 1000
    CHECK (max_wish_length BETWEEN 50 AND 5000),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_events_owner ON public.events(owner_id, created_at DESC);
CREATE INDEX idx_events_visible_slug ON public.events(slug) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 4. Create wishes table
CREATE TABLE public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_request_id uuid NOT NULL,
  sender_name text NOT NULL CHECK (char_length(sender_name) BETWEEN 1 AND 100),
  sender_avatar_path text,
  content text,
  moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  is_pinned boolean NOT NULL DEFAULT false,
  moderation_reason text,
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(event_id, client_request_id),
  CHECK (content IS NULL OR char_length(content) <= 5000)
);

CREATE INDEX idx_wishes_public_wall
  ON public.wishes(event_id, is_pinned DESC, created_at DESC, id DESC)
  WHERE moderation_status = 'approved' AND deleted_at IS NULL;

CREATE INDEX idx_wishes_moderation_queue
  ON public.wishes(event_id, moderation_status, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_wishes_author ON public.wishes(author_id)
  WHERE author_id IS NOT NULL;

CREATE INDEX idx_wishes_moderated_by ON public.wishes(moderated_by)
  WHERE moderated_by IS NOT NULL;

CREATE TRIGGER trg_wishes_updated_at
BEFORE UPDATE ON public.wishes
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 5. Create wish_media table
CREATE TABLE public.wish_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'audio')),
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  width integer,
  height integer,
  duration_ms integer,
  processing_status text NOT NULL DEFAULT 'ready'
    CHECK (processing_status IN ('uploading', 'ready', 'failed', 'quarantined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wish_media_wish ON public.wish_media(wish_id);

-- 6. Create wish_reactions table
CREATE TABLE public.wish_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id uuid NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_key_hash text,
  emoji text NOT NULL CHECK (emoji IN ('🎓', '❤️', '🎉', '👏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (actor_id IS NOT NULL OR actor_key_hash IS NOT NULL)
);

CREATE UNIQUE INDEX uq_reaction_authenticated
  ON public.wish_reactions(wish_id, actor_id, emoji)
  WHERE actor_id IS NOT NULL;

CREATE UNIQUE INDEX uq_reaction_guest
  ON public.wish_reactions(wish_id, actor_key_hash, emoji)
  WHERE actor_key_hash IS NOT NULL;

-- 7. Create moderation_audit_logs table
CREATE TABLE public.moderation_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  wish_id uuid REFERENCES public.wishes(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_event_time
  ON public.moderation_audit_logs(event_id, created_at DESC);

-- 8. Safe server-only view for the public projection
CREATE VIEW public.public_wishes_view
WITH (security_invoker = true)
AS
SELECT
  w.id,
  w.event_id,
  w.sender_name,
  w.sender_avatar_path,
  w.content,
  w.is_pinned,
  w.created_at
FROM public.wishes w
JOIN public.events e ON e.id = w.event_id
WHERE w.moderation_status = 'approved'
  AND w.deleted_at IS NULL
  AND e.deleted_at IS NULL
  AND e.archived_at IS NULL
  AND e.visibility IN ('public', 'unlisted');

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Explicit Grants
-- Revoke default and inherited PUBLIC access.
REVOKE ALL ON public.events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wishes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wish_media FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wish_reactions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.moderation_audit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.public_wishes_view FROM PUBLIC, anon, authenticated;

-- Authenticated owners can manage only their own event rows through RLS.
-- Hard delete is intentionally not granted; the application uses soft delete.
GRANT SELECT, INSERT, UPDATE ON public.events TO authenticated;

-- Owners can read wishes for moderation, but a later command/RPC owns all
-- moderation mutations. No table-level UPDATE or DELETE is granted here.
GRANT SELECT ON public.wishes TO authenticated;

-- Public pages are server-rendered through a server-only DAL. The service role
-- can read base tables, but only allowlisted DTOs may leave that DAL.
GRANT ALL ON public.events, public.wishes TO service_role;
GRANT SELECT ON public.public_wishes_view TO service_role;

-- Media, reactions, and moderation audit remain inert until their dedicated
-- tasks add commands, grants, and policies.

-- 11. RLS Policies

-- events
CREATE POLICY "owners can read own events" ON public.events
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "owners can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "owners can update own events" ON public.events
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = owner_id)
WITH CHECK ((SELECT auth.uid()) = owner_id);

-- wishes
CREATE POLICY "owners can read all event wishes" ON public.wishes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = wishes.event_id AND e.owner_id = (SELECT auth.uid())
  )
);
