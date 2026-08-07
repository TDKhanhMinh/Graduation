-- Versioned, public-safe Welcome Hero configuration.
-- Existing events keep their current experience preset/effect intensity through
-- the application adapter until a host saves an explicit Welcome config.
ALTER TABLE public.events
  ADD COLUMN welcome_hero jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(welcome_hero) = 'object');

COMMENT ON COLUMN public.events.welcome_hero IS
  'Versioned Welcome Hero UI config; server DAL validates and allowlists public fields before rendering.';
