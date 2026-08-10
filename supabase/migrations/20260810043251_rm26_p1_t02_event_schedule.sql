-- RM26 P1-T02: additive event schedule contract.
-- Existing event_date remains the compatibility source of truth for legacy rows.

CREATE OR REPLACE FUNCTION private.is_supported_timezone(p_timezone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT p_timezone IN ('UTC', 'Etc/UTC')
    OR EXISTS (
      SELECT 1
      FROM pg_timezone_names
      WHERE name = p_timezone
    );
$$;

COMMENT ON FUNCTION private.is_supported_timezone(text)
  IS 'Returns whether a timezone name is present in PostgreSQL''s supported IANA timezone catalog.';

REVOKE ALL ON FUNCTION private.is_supported_timezone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_supported_timezone(text) TO authenticated, service_role;

ALTER TABLE public.events
  ADD COLUMN starts_at timestamptz,
  ADD COLUMN ends_at timestamptz,
  ADD COLUMN timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN location_name text,
  ADD COLUMN location_address text,
  ADD COLUMN host_name text,
  ADD COLUMN host_title text;

-- Legacy event_date is already a UTC instant (timestamptz). Preserve it exactly
-- and make the legacy display timezone explicit instead of inferring from a
-- server or browser timezone.
UPDATE public.events
SET starts_at = event_date
WHERE starts_at IS NULL
  AND event_date IS NOT NULL;

ALTER TABLE public.events
  ADD CONSTRAINT events_timezone_check
    CHECK (private.is_supported_timezone(timezone)),
  ADD CONSTRAINT events_schedule_range_check
    CHECK (
      (ends_at IS NULL OR starts_at IS NOT NULL)
      AND (ends_at IS NULL OR ends_at > starts_at)
    ),
  ADD CONSTRAINT events_schedule_label_lengths_check
    CHECK (
      (location_name IS NULL OR char_length(location_name) <= 160)
      AND (location_address IS NULL OR char_length(location_address) <= 500)
      AND (host_name IS NULL OR char_length(host_name) <= 160)
      AND (host_title IS NULL OR char_length(host_title) <= 160)
    );

COMMENT ON COLUMN public.events.starts_at
  IS 'UTC instant at which the event starts; legacy rows are backfilled from event_date.';
COMMENT ON COLUMN public.events.ends_at
  IS 'UTC instant at which the event ends; NULL means no scheduled end.';
COMMENT ON COLUMN public.events.timezone
  IS 'IANA timezone identifier used to render the event''s local wall time.';
COMMENT ON COLUMN public.events.location_name
  IS 'Optional public-safe venue or location name; never an address credential.';
COMMENT ON COLUMN public.events.location_address
  IS 'Optional public-safe venue address.';
COMMENT ON COLUMN public.events.host_name
  IS 'Optional public-safe host display name.';
COMMENT ON COLUMN public.events.host_title
  IS 'Optional public-safe host title or role.';

CREATE INDEX idx_events_schedule_visibility
  ON public.events(visibility, starts_at)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

-- The events table is already RLS-protected and only the server-side DAL has
-- service_role access. No anon/authenticated table grant is added for the new
-- columns; the public projection remains an explicit allowlist in the DAL.
