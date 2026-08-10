BEGIN;

SELECT plan(12);

-- Setup test data
-- Reuse the deterministic users inserted by supabase/seed.sql.

-- Give users the 'authenticated' role context
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Owner creates an event
INSERT INTO public.events (id, owner_id, slug, title, submission_mode, visibility)
VALUES ('00000000-0000-0000-0000-000000000001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'test-event-p2', 'Test Event', 'approval_required', 'public');

-- Switch to service_role to insert test wishes bypassing RLS
RESET ROLE;
SET role service_role;

-- Insert 1 approved wish, 1 pending wish, 1 rejected wish
INSERT INTO public.wishes (id, event_id, client_request_id, sender_name, content, moderation_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'c1111111-1111-4111-8111-111111111111', 'Sender 1', 'Approved wish', 'approved'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'c2222222-2222-4222-8222-222222222222', 'Sender 2', 'Pending wish', 'pending'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'c3333333-3333-4333-8333-333333333333', 'Sender 3', 'Rejected wish', 'rejected');

-- 1. Test Owner can read all wishes for their event
RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.wishes WHERE event_id = '00000000-0000-0000-0000-000000000001' $$,
    ARRAY[3],
    'Owner should be able to read all wishes for their event'
);

-- 2. Test Non-owner cannot read wishes
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.wishes WHERE event_id = '00000000-0000-0000-0000-000000000001' $$,
    ARRAY[0],
    'Non-owner should not be able to read wishes for other events'
);

-- 3. Test Anon cannot read from base table wishes
RESET ROLE;
SET role anon;
-- 'anon' doesn't even have SELECT grant on public.wishes, but just in case:
SELECT throws_ok(
    $$ SELECT client_request_id FROM public.wishes LIMIT 1 $$,
    '42501', -- permission denied
    NULL,
    'Anon cannot read sensitive fields directly from wishes table'
);

-- 4. Test Anon cannot enumerate the server-only public projection
SELECT throws_ok(
    $$ SELECT id FROM public.public_wishes_view $$,
    '42501',
    NULL,
    'Anon cannot read public_wishes_view'
);

-- 5. Test public_wishes_view does not expose sensitive columns
SELECT throws_ok(
    $$ SELECT client_request_id FROM public.public_wishes_view $$,
    '42703', -- column does not exist
    NULL,
    'public_wishes_view should not contain client_request_id'
);

-- 6. Test moderation RPC (Owner approves pending wish)
RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT lives_ok(
    $$ SELECT moderate_wishes(ARRAY['22222222-2222-2222-2222-222222222222']::uuid[], 'approve') $$,
    'Owner can call moderate_wishes on pending wish'
);

SELECT results_eq(
    $$ SELECT moderation_status FROM public.wishes WHERE id = '22222222-2222-2222-2222-222222222222' $$,
    ARRAY['approved'::text],
    'Pending wish should be approved'
);

-- 7. Test audit log is created
-- Switch to service_role to read audit log
RESET ROLE;
SET role service_role;
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.moderation_audit_logs WHERE wish_id = '22222222-2222-2222-2222-222222222222' AND action = 'approve' $$,
    ARRAY[1],
    'Audit log should be created for moderation action'
);

-- 8. Test realtime_wall_events triggered
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.realtime_wall_events WHERE wish_id = '22222222-2222-2222-2222-222222222222' AND action = 'upsert' $$,
    ARRAY[1],
    'realtime_wall_events should have an upsert record after approval'
);

-- 9. Test Non-owner cannot moderate
RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT throws_ok(
    $$ SELECT moderate_wishes(ARRAY['11111111-1111-1111-1111-111111111111']::uuid[], 'hide') $$,
    '42501', -- insufficient_privilege / MODERATION_NOT_ALLOWED
    'MODERATION_NOT_ALLOWED',
    'Non-owner should not be able to moderate wishes'
);

-- 10. Owner hides the approved wish
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT lives_ok(
    $$ SELECT moderate_wishes(ARRAY['11111111-1111-1111-1111-111111111111']::uuid[], 'hide') $$,
    'Owner can hide an approved wish'
);

-- 11. Test realtime_wall_events triggered for remove
RESET ROLE;
SET role service_role;
SELECT results_eq(
    $$ SELECT count(*)::integer FROM public.realtime_wall_events WHERE wish_id = '11111111-1111-1111-1111-111111111111' AND action = 'remove' $$,
    ARRAY[1],
    'realtime_wall_events should have a remove record after hiding'
);

-- 12. Test submit_wish function concurrency/rate-limits (if applicable in database)
-- Assuming submit_wish is a Supabase Edge Function or Next.js server action, not a DB function. 
-- So database-level testing for it might just be inserting a row.

-- Cleanup (rolled back by pgTAP automatically)
SELECT * FROM finish();
ROLLBACK;
