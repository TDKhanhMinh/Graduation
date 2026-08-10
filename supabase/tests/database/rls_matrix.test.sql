BEGIN;

SELECT plan(10);

SET ROLE anon;

SELECT throws_ok(
  $$ SELECT slug FROM public.events $$,
  '42501',
  'permission denied for table events',
  'Anon cannot enumerate public or unlisted events'
);

SELECT throws_ok(
  $$ SELECT id FROM public.public_wishes_view $$,
  '42501',
  NULL,
  'Anon cannot enumerate the server-only public projection'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT is_empty(
  $$ SELECT slug FROM public.events WHERE visibility = 'private' $$,
  'Non-owner cannot read private events'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
  $$ SELECT slug FROM public.events WHERE visibility = 'private' $$,
  $$ VALUES ('private-event-1') $$,
  'Owner can read private events'
);

SELECT results_eq(
  $$ UPDATE public.events
     SET title = 'Updated Title'
     WHERE slug = 'public-event-1'
     RETURNING title $$,
  $$ VALUES ('Updated Title') $$,
  'Owner can update own events'
);

SELECT throws_ok(
  $$ UPDATE public.wishes
     SET content = 'tampered'
     WHERE id = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01' $$,
  '42501',
  'permission denied for table wishes',
  'Owner cannot mutate wish content directly'
);

SELECT throws_ok(
  $$ DELETE FROM public.events
     WHERE id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01' $$,
  '42501',
  'permission denied for table events',
  'Owner cannot hard-delete events directly'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT is_empty(
  $$ UPDATE public.events
     SET title = 'Hacked'
     WHERE slug = 'public-event-1'
     RETURNING title $$,
  'Non-owner cannot update events'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
  $$ UPDATE public.events
     SET deleted_at = now()
     WHERE slug = 'public-event-1'
       AND deleted_at IS NULL
     RETURNING deleted_at IS NOT NULL $$,
  $$ VALUES (true) $$,
  'Owner can soft-delete own event'
);

SELECT is_empty(
  $$ UPDATE public.events
     SET deleted_at = now()
     WHERE slug = 'public-event-1'
       AND deleted_at IS NULL
     RETURNING id $$,
  'Soft-delete transition is idempotent for an already-deleted event'
);

ROLLBACK;
