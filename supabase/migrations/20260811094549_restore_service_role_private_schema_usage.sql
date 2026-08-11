-- Restore only the schema visibility required by the service-only submission path.
-- Object-level grants on private tables and functions remain unchanged.
GRANT USAGE ON SCHEMA private TO service_role;
