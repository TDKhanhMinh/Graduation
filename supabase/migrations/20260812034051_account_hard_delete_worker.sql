-- Compatibility migration kept at the original timestamp.
-- The first draft of this migration hard-deleted auth.users directly before
-- application data was journaled. The lifecycle implementation now lives in
-- 20260812120000_account_lifecycle_and_collaborator_access.sql.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION private.process_hard_deletions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Replaced by the reviewed lifecycle worker in the next migration.
  RETURN 0;
END;
$function$;

REVOKE ALL ON FUNCTION private.process_hard_deletions() FROM PUBLIC;
