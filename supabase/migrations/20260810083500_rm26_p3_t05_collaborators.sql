-- RM26 P3-T05: canonical event collaborators and hashed invitations.

CREATE TABLE public.event_collaborators (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('editor', 'moderator', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX event_collaborators_user_idx
  ON public.event_collaborators(user_id, updated_at DESC);

CREATE TABLE public.event_invitations (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  role text NOT NULL CHECK (role IN ('editor', 'moderator', 'viewer')),
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  token_expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (accepted_at IS NULL OR accepted_by IS NOT NULL)
);

CREATE UNIQUE INDEX event_invitations_active_email
  ON public.event_invitations(event_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_collaborators, public.event_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.event_collaborators TO authenticated;
GRANT ALL ON public.event_collaborators, public.event_invitations TO service_role;

CREATE POLICY event_collaborators_member_read
ON public.event_collaborators
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.events AS event_row
    WHERE event_row.id = event_collaborators.event_id
      AND event_row.owner_id = (SELECT auth.uid())
  )
);

CREATE OR REPLACE FUNCTION private.set_collaborator_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.set_collaborator_updated_at() FROM PUBLIC;

CREATE TRIGGER trg_event_collaborators_updated_at
BEFORE UPDATE ON public.event_collaborators
FOR EACH ROW EXECUTE FUNCTION private.set_collaborator_updated_at();

CREATE OR REPLACE FUNCTION public.create_event_invitation(
  p_invitation_id uuid,
  p_event_id uuid,
  p_owner_id uuid,
  p_email text,
  p_role text,
  p_token_hash text,
  p_token_expires_at timestamptz
)
RETURNS TABLE (id uuid, event_id uuid, email text, role text, token_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  normalized_email text := lower(trim(p_email));
BEGIN
  IF p_role NOT IN ('editor', 'moderator', 'viewer')
     OR p_token_hash !~ '^[a-f0-9]{64}$'
     OR p_token_expires_at <= now()
     OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  THEN
    RAISE EXCEPTION 'COLLABORATOR_INVITE_INPUT_INVALID' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events AS event_row
    WHERE event_row.id = p_event_id
      AND event_row.owner_id = p_owner_id
      AND event_row.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'COLLABORATOR_OWNER_REQUIRED' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.event_invitations (
    id, event_id, invited_by, email, role, token_hash, token_expires_at
  )
  VALUES (
    p_invitation_id, p_event_id, p_owner_id, normalized_email, p_role, p_token_hash, p_token_expires_at
  );

  RETURN QUERY
  SELECT invitation.id, invitation.event_id, invitation.email, invitation.role, invitation.token_expires_at
  FROM public.event_invitations AS invitation
  WHERE invitation.id = p_invitation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_event_invitation(uuid, uuid, uuid, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_event_invitation(uuid, uuid, uuid, text, text, text, timestamptz)
  TO service_role;

CREATE OR REPLACE FUNCTION public.accept_event_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_token_hash text
)
RETURNS TABLE (event_id uuid, user_id uuid, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  invitation public.event_invitations%ROWTYPE;
  user_email text;
BEGIN
  SELECT * INTO invitation
  FROM public.event_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  SELECT lower(email) INTO user_email FROM auth.users WHERE id = p_user_id;

  IF invitation.id IS NULL
     OR invitation.token_hash <> p_token_hash
     OR invitation.token_expires_at <= now()
     OR invitation.accepted_at IS NOT NULL
     OR invitation.revoked_at IS NOT NULL
     OR user_email IS NULL
     OR lower(invitation.email) <> user_email
  THEN
    RAISE EXCEPTION 'COLLABORATOR_INVITE_INVALID' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.event_collaborators (event_id, user_id, role, invited_by)
  VALUES (invitation.event_id, p_user_id, invitation.role, invitation.invited_by)
  ON CONFLICT (event_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = now();

  UPDATE public.event_invitations
  SET accepted_at = now(), accepted_by = p_user_id
  WHERE id = invitation.id;

  RETURN QUERY SELECT invitation.event_id, p_user_id, invitation.role;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_event_invitation(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_event_invitation(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.set_event_collaborator_role(
  p_event_id uuid,
  p_owner_id uuid,
  p_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_role NOT IN ('editor', 'moderator', 'viewer') THEN
    RAISE EXCEPTION 'COLLABORATOR_ROLE_INVALID' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND owner_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'COLLABORATOR_OWNER_REQUIRED' USING ERRCODE = '42501';
  END IF;
  UPDATE public.event_collaborators
  SET role = p_role, updated_at = now()
  WHERE event_id = p_event_id AND user_id = p_user_id;
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_event_collaborator(
  p_event_id uuid,
  p_owner_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND owner_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'COLLABORATOR_OWNER_REQUIRED' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.event_collaborators
  WHERE event_id = p_event_id AND user_id = p_user_id;
  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_event_collaborator_role(uuid, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.remove_event_collaborator(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_event_collaborator_role(uuid, uuid, uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_event_collaborator(uuid, uuid, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.revoke_event_invitation(
  p_invitation_id uuid,
  p_owner_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH revoked AS (
    UPDATE public.event_invitations AS invitation
    SET revoked_at = now()
    WHERE invitation.id = p_invitation_id
      AND invitation.invited_by = p_owner_id
      AND invitation.accepted_at IS NULL
      AND invitation.revoked_at IS NULL
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM revoked);
$function$;

REVOKE ALL ON FUNCTION public.revoke_event_invitation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_event_invitation(uuid, uuid)
  TO service_role;
