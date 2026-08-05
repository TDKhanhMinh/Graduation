-- The event-trigger function is invoked by PostgreSQL, not by the Data API.
-- Remove direct execution from application roles and keep the trigger owner-only.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role;