-- RM26: Account Hard Delete Worker
-- Creates a function and pg_cron job to automatically hard delete users
-- that have passed their 30-day cooling off period.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION private.process_hard_deletions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  r RECORD;
  deleted_count integer := 0;
BEGIN
  FOR r IN
    SELECT id, user_id
    FROM public.account_deletion_requests
    WHERE status = 'cooling_off'
      AND scheduled_for <= now()
      AND user_id IS NOT NULL
  LOOP
    -- 1. Satisfy RESTRICT constraints
    -- Remove any collaborators or invitations where this user was the inviter.
    -- This is required because event_collaborators.invited_by and 
    -- event_invitations.invited_by use ON DELETE RESTRICT against auth.users.
    DELETE FROM public.event_collaborators WHERE invited_by = r.user_id;
    DELETE FROM public.event_invitations WHERE invited_by = r.user_id;

    -- 2. Hard delete the user from auth.users
    -- GoTrue identities and sessions, as well as public.events and public.wishes
    -- will cascade delete automatically based on ON DELETE CASCADE constraints.
    DELETE FROM auth.users WHERE id = r.user_id;

    -- 3. Update the request status
    -- The user_id column in this table will have been set to NULL due to ON DELETE SET NULL,
    -- but we still have the request row `r.id` to mark as purged.
    UPDATE public.account_deletion_requests
    SET status = 'purged',
        purged_at = now()
    WHERE id = r.id;

    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$function$;

DO $$
BEGIN
  -- Attempt to unschedule if it already exists to avoid duplicates
  PERFORM cron.unschedule('hard-delete-worker');
  
  -- Schedule to run at minute 0 past every hour
  PERFORM cron.schedule(
    'hard-delete-worker',
    '0 * * * *',
    'SELECT private.process_hard_deletions();'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_cron could not be configured: %', SQLERRM;
END $$;
