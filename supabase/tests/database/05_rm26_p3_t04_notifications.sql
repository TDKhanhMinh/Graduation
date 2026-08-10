BEGIN;

SELECT plan(13);

SET role service_role;

INSERT INTO public.events (id, owner_id, slug, title, submission_mode, visibility)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'test-event-p3-t04',
  'Notification test event',
  'approval_required',
  'public'
);

INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  '00000000-0000-0000-0000-000000000004',
  'c4444444-4444-4444-8444-444444444444',
  'Sender 4',
  'Pending content must not enter notification payload',
  'pending'
);

RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004' $$,
  ARRAY[1],
  'Owner receives one durable pending-wish notification'
);

SELECT results_eq(
  $$ SELECT payload ->> 'type' FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004' $$,
  ARRAY['pending_wish'::text],
  'Notification payload contains only the non-sensitive event type'
);

SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004' $$,
  ARRAY[0],
  'Non-owner cannot enumerate notification rows'
);

RESET ROLE;
SET role anon;
SELECT throws_ok(
  $$ SELECT id FROM public.notification_events LIMIT 1 $$,
  '42501',
  NULL,
  'Anon cannot read notification rows'
);

RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT lives_ok(
  $$ SELECT public.mark_notification_read((
       SELECT id FROM public.notification_events
       WHERE event_id = '00000000-0000-0000-0000-000000000004'
     )) $$,
  'Owner can mark one notification read through the RPC'
);

SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004'
       AND read_at IS NULL $$,
  ARRAY[0],
  'Read state is persisted without exposing an update grant'
);

SELECT lives_ok(
  $$ SELECT public.set_notification_preferences(
       '00000000-0000-0000-0000-000000000004', false
     ) $$,
  'Owner can disable pending-wish in-app notifications'
);

RESET ROLE;
SET role service_role;
INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '55555555-5555-4555-8555-555555555555',
  '00000000-0000-0000-0000-000000000004',
  'c5555555-5555-4555-8555-555555555555',
  'Sender 5',
  'Disabled notification fixture',
  'pending'
);

RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004' $$,
  ARRAY[1],
  'Disabled preference suppresses new notification rows'
);

SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
SELECT throws_ok(
  $$ SELECT public.mark_all_notifications_read(
       '00000000-0000-0000-0000-000000000004'
     ) $$,
  '42501',
  'NOTIFICATION_NOT_ALLOWED',
  'Non-owner cannot mark an event inbox read'
);

SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT lives_ok(
  $$ SELECT public.set_notification_preferences(
       '00000000-0000-0000-0000-000000000004', true
     ) $$,
  'Owner can re-enable pending-wish notifications'
);

RESET ROLE;
SET role service_role;
INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '66666666-6666-4666-8666-666666666666',
  '00000000-0000-0000-0000-000000000004',
  'c6666666-6666-4666-8666-666666666666',
  'Sender 6',
  'Re-enabled notification fixture',
  'pending'
);

RESET ROLE;
SET role authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004' $$,
  ARRAY[2],
  'Re-enabled preference creates the next notification'
);

SELECT lives_ok(
  $$ SELECT public.mark_all_notifications_read(
       '00000000-0000-0000-0000-000000000004'
     ) $$,
  'Owner can mark the full inbox read'
);

SELECT results_eq(
  $$ SELECT count(*)::integer FROM public.notification_events
     WHERE event_id = '00000000-0000-0000-0000-000000000004'
       AND read_at IS NULL $$,
  ARRAY[0],
  'Mark-all read leaves no unread owner notifications'
);

SELECT * FROM finish();
ROLLBACK;
