BEGIN;

SELECT plan(13);

SELECT has_table('public', 'events', 'events table exists');
SELECT has_table('public', 'wishes', 'wishes table exists');

SELECT results_eq(
  $$ SELECT moderation_status::text
     FROM public.wishes
     ORDER BY moderation_status::text $$,
  $$ VALUES ('approved'), ('hidden'), ('pending'), ('rejected') $$,
  'Seed covers every moderation status without relying on production data'
);

SET ROLE anon;

SELECT throws_ok(
  $$ INSERT INTO public.wishes (event_id, client_request_id, sender_name, content)
     VALUES ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', gen_random_uuid(), 'Test', 'Test') $$,
  '42501',
  'permission denied for table wishes',
  'Anon cannot insert wishes'
);

SELECT throws_ok(
  $$ SELECT slug FROM public.events $$,
  '42501',
  'permission denied for table events',
  'Anon cannot enumerate event rows'
);

SELECT results_eq(
  $$ SELECT count(*)::integer
     FROM public.public_wishes_view
     WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01' $$,
  ARRAY[1],
  'Anon reads only the approved public DTO projection'
);

RESET ROLE;
SET ROLE service_role;

SELECT results_eq(
  $$ SELECT sender_name FROM public.public_wishes_view ORDER BY sender_name $$,
  $$ VALUES ('Alice') $$,
  'Public projection returns approved wishes'
);

RESET ROLE;

SELECT is_empty(
  $$ SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'public_wishes_view'
       AND column_name IN (
         'author_id',
         'client_request_id',
         'moderation_reason',
         'moderated_by',
         'moderated_at',
         'actor_key_hash'
       ) $$,
  'Public projection excludes sensitive fields'
);

SELECT is(
  has_table_privilege('authenticated', 'public.wishes', 'UPDATE'),
  false,
  'Authenticated role has no table-level wish UPDATE'
);

SELECT is(
  has_table_privilege('authenticated', 'public.wishes', 'DELETE'),
  false,
  'Authenticated role has no table-level wish DELETE'
);

SELECT ok(
  (
    SELECT indexdef LIKE '%created_at DESC, id DESC%'
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_wishes_public_wall'
  ),
  'Public wall index has deterministic keyset tie-breaker'
);

SELECT ok(
  (
    SELECT indexdef LIKE '%created_at DESC, id DESC%'
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_wishes_moderation_queue'
  ),
  'Moderation index has deterministic keyset tie-breaker'
);

SELECT ok(
  (
    SELECT c.reloptions @> ARRAY['security_invoker=true']
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'public_wishes_view'
  ),
  'Public wishes view uses a fixed safe projection'
);

ROLLBACK;
