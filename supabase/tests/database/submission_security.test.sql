BEGIN;

SELECT plan(19);

SELECT is(
  has_function_privilege(
    'anon',
    'public.submit_wish_transaction(uuid,uuid,text,text,text,text,text,text,text,bigint,integer,integer,integer,integer,integer,integer,integer)',
    'EXECUTE'
  ),
  false,
  'Anon cannot call the submission transaction directly'
);

SELECT is(
  has_function_privilege(
    'authenticated',
    'public.submit_wish_transaction(uuid,uuid,text,text,text,text,text,text,text,bigint,integer,integer,integer,integer,integer,integer,integer)',
    'EXECUTE'
  ),
  false,
  'Authenticated clients cannot call the submission transaction directly'
);

SELECT is(
  has_table_privilege('anon', 'private.wish_submission_rate_limits', 'SELECT'),
  false,
  'Anon cannot inspect private rate-limit state'
);

SET ROLE service_role;

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
       'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
       'Guest',
       'A safe wish',
       'ip-a',
       'device-a'
     ) $$,
  $$ VALUES ('OK'::text) $$,
  'Service role can create a validated pending wish'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.wishes
     WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'
       AND client_request_id = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01' $$,
  $$ VALUES ('pending'::text) $$,
  'Approval-required event creates a pending wish'
);

SELECT results_eq(
  $$ SELECT is_pinned
     FROM public.wishes
     WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'
       AND client_request_id = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01' $$,
  $$ VALUES (false) $$,
  'Submission transaction always owns the pinned field'
);

SELECT results_eq(
  $$ SELECT was_duplicate
     FROM public.submit_wish_transaction(
       'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
       'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01',
       'Tampered guest',
       'Changed retry payload',
       'ip-b',
       'device-b'
     ) $$,
  $$ VALUES (true) $$,
  'Retrying an idempotency key returns the existing logical result'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.wishes
    WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'
      AND client_request_id = 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'
  ),
  1,
  'Idempotent retry creates exactly one row'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.submit_wish_transaction(
       'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380e02',
       'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d02',
       'Guest',
       'Open event wish',
       'ip-c',
       'device-c'
     ) $$,
  $$ VALUES ('approved'::text) $$,
  'Open submission mode creates an approved wish'
);

SELECT ok(
  (
    SELECT approved_at IS NOT NULL AND is_pinned IS false
    FROM public.wishes
    WHERE event_id = 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380e02'
      AND client_request_id = 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'
  ),
  'Auto-approved wish receives server-owned approval fields'
);

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
       'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d03',
       'Guest',
       'Private event wish',
       'ip-d',
       'device-d'
     ) $$,
  $$ VALUES ('EVENT_NOT_FOUND'::text) $$,
  'Private event is indistinguishable from a missing event'
);

UPDATE public.events
SET visibility = 'unlisted'
WHERE id = 'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03';

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
       'd4eebc99-9c0b-4ef8-bb6d-6bb9bd380d04',
       'Guest',
       'Closed event wish',
       'ip-e',
       'device-e'
     ) $$,
  $$ VALUES ('EVENT_CLOSED'::text) $$,
  'Closed event rejects submissions'
);

UPDATE public.events
SET submission_mode = 'open',
    archived_at = now()
WHERE id = 'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03';

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
       'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380d05',
       'Guest',
       'Archived event wish',
       'ip-f',
       'device-f'
     ) $$,
  $$ VALUES ('EVENT_UNAVAILABLE'::text) $$,
  'Archived event rejects submissions'
);

UPDATE public.events
SET archived_at = NULL,
    deleted_at = now()
WHERE id = 'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03';

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
       'd6eebc99-9c0b-4ef8-bb6d-6bb9bd380d06',
       'Guest',
       'Deleted event wish',
       'ip-g',
       'device-g'
     ) $$,
  $$ VALUES ('EVENT_UNAVAILABLE'::text) $$,
  'Soft-deleted event rejects submissions'
);

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
       'd7eebc99-9c0b-4ef8-bb6d-6bb9bd380d07',
       'Guest',
       repeat('x', 1001),
       'ip-h',
       'device-h'
     ) $$,
  $$ VALUES ('VALIDATION_ERROR'::text) $$,
  'Event-specific wish length is enforced in the transaction'
);

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
       'd8eebc99-9c0b-4ef8-bb6d-6bb9bd380d08',
       'Guest',
       'First limited wish',
       'shared-ip',
       'unique-device-1',
       p_event_limit => 100,
       p_ip_limit => 1,
       p_device_limit => 100,
       p_window_seconds => 600
     ) $$,
  $$ VALUES ('OK'::text) $$,
  'First request inside a rate window succeeds'
);

SELECT results_eq(
  $$ SELECT result_code
     FROM public.submit_wish_transaction(
       'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
       'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380d09',
       'Guest',
       'Second limited wish',
       'shared-ip',
       'unique-device-2',
       p_event_limit => 100,
       p_ip_limit => 1,
       p_device_limit => 100,
       p_window_seconds => 600
     ) $$,
  $$ VALUES ('RATE_LIMITED'::text) $$,
  'Multi-key rate limiter rejects an exhausted IP key'
);

SELECT ok(
  (
    SELECT retry_after_seconds > 0
    FROM public.submit_wish_transaction(
      'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
      'daeebc99-9c0b-4ef8-bb6d-6bb9bd380d10',
      'Guest',
      'Third limited wish',
      'shared-ip',
      'unique-device-3',
       p_event_limit => 100,
       p_ip_limit => 1,
       p_device_limit => 100,
       p_window_seconds => 600
    )
  ),
  'Rate-limit response includes positive retry guidance'
);

SELECT is(
  (
    SELECT prosecdef
    FROM pg_proc
    WHERE oid = 'public.submit_wish_transaction(uuid,uuid,text,text,text,text,text,text,text,bigint,integer,integer,integer,integer,integer,integer,integer)'::regprocedure
  ),
  false,
  'Submission RPC remains security invoker'
);

ROLLBACK;
