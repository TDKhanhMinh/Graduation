BEGIN;

SELECT plan(20);

SELECT has_column('public', 'events', 'starts_at', 'Events has a UTC start instant');
SELECT has_column('public', 'events', 'ends_at', 'Events has an optional UTC end instant');
SELECT has_column('public', 'events', 'timezone', 'Events has an IANA timezone');
SELECT has_column('public', 'events', 'location_name', 'Events has a public-safe location name');
SELECT has_column('public', 'events', 'location_address', 'Events has a public-safe location address');
SELECT has_column('public', 'events', 'host_name', 'Events has a public-safe host name');
SELECT has_column('public', 'events', 'host_title', 'Events has a public-safe host title');

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_timezone_check'
  ),
  'Timezone support constraint exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_schedule_range_check'
  ),
  'Schedule range constraint exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_events_schedule_visibility'
  ),
  'Schedule visibility index exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND conname = 'events_schedule_label_lengths_check'
  ),
  'Location and host length constraint exists'
);

SELECT is(
  (SELECT starts_at = event_date FROM public.events WHERE id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'),
  true,
  'Legacy event_date is backfilled exactly into starts_at'
);

SELECT is(
  (SELECT timezone FROM public.events WHERE id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'),
  'UTC',
  'Legacy rows use explicit UTC display timezone'
);

SET ROLE service_role;

SELECT throws_ok(
  $$ INSERT INTO public.events (
       id, owner_id, slug, title, timezone
     ) VALUES (
       'e6eebc99-9c0b-4ef8-bb6d-6bb9bd380e06',
       'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
       'invalid-timezone-fixture',
       'Invalid timezone fixture',
       'Mars/Phobos'
     ) $$,
  '23514',
  NULL,
  'Unsupported timezone is rejected'
);

SELECT throws_ok(
  $$ INSERT INTO public.events (
       id, owner_id, slug, title, starts_at, ends_at
     ) VALUES (
       'e7eebc99-9c0b-4ef8-bb6d-6bb9bd380e07',
       'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
       'invalid-range-fixture',
       'Invalid range fixture',
       '2026-08-10T10:00:00.000Z',
       '2026-08-10T09:00:00.000Z'
     ) $$,
  '23514',
  NULL,
  'End instant must be after start instant'
);

RESET ROLE;

SELECT is(
  has_table_privilege('anon', 'public.events', 'SELECT'),
  false,
  'Anon cannot enumerate event rows'
);

SELECT is(
  has_table_privilege('authenticated', 'public.events', 'SELECT'),
  true,
  'Authenticated owners retain event table access'
);

SELECT is(
  has_table_privilege('service_role', 'public.events', 'SELECT'),
  true,
  'Server DAL retains event table access'
);

SELECT ok(
  (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.events'::regclass
  ),
  'Events RLS remains enabled'
);

SELECT is_empty(
  $$ SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'public_wishes_view'
       AND column_name IN (
         'starts_at',
         'ends_at',
         'timezone',
         'location_name',
         'location_address',
         'host_name',
         'host_title'
       ) $$,
  'Wish public projection does not expose event schedule internals'
);

SELECT * FROM finish();
ROLLBACK;
