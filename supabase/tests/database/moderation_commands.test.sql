BEGIN;

SELECT plan(30);

SELECT is(
  has_table_privilege('authenticated', 'public.wishes', 'UPDATE'),
  false,
  'Authenticated clients retain no direct wish UPDATE privilege'
);

SELECT is(
  has_table_privilege('authenticated', 'public.moderation_audit_logs', 'INSERT'),
  false,
  'Authenticated clients cannot insert audit rows'
);

SELECT is(
  has_table_privilege('authenticated', 'public.moderation_audit_logs', 'UPDATE'),
  false,
  'Authenticated clients cannot update audit rows'
);

SELECT is(
  has_table_privilege('authenticated', 'public.moderation_audit_logs', 'DELETE'),
  false,
  'Authenticated clients cannot delete audit rows'
);

SELECT is(
  has_function_privilege(
    'anon',
    'public.moderate_wishes(uuid[],text,text,jsonb)',
    'EXECUTE'
  ),
  false,
  'Anon cannot execute moderation commands'
);

INSERT INTO public.wishes (
  id,
  event_id,
  client_request_id,
  sender_name,
  content,
  moderation_status
)
VALUES
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f01',
    'Bulk pending',
    'Pending',
    'pending'
  ),
  (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b02',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380f02',
    'Bulk rejected',
    'Rejected',
    'rejected'
  ),
  (
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380f03',
    'Atomic approved',
    'Approved',
    'approved'
  ),
  (
    'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380b04',
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
    'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380f04',
    'Atomic pending',
    'Pending',
    'pending'
  );

SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT throws_ok(
  $$ SELECT * FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'approve'
     ) $$,
  '42501',
  'MODERATION_NOT_ALLOWED',
  'Non-owner cannot moderate a wish'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'approve'
     ) $$,
  $$ VALUES ('approved'::text) $$,
  'Owner can approve a pending wish'
);

SELECT ok(
  (
    SELECT approved_at IS NOT NULL
      AND moderated_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      AND moderated_at IS NOT NULL
    FROM public.wishes
    WHERE id = 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'
  ),
  'Approve writes server-owned moderation metadata'
);

SELECT results_eq(
  $$ SELECT is_pinned
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'pin'
     ) $$,
  $$ VALUES (true) $$,
  'Owner can pin an approved wish'
);

SELECT results_eq(
  $$ SELECT is_pinned
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'unpin'
     ) $$,
  $$ VALUES (false) $$,
  'Owner can unpin an approved wish'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'hide',
       'Owner hid the wish'
     ) $$,
  $$ VALUES ('hidden'::text) $$,
  'Owner can hide an approved wish'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'approve'
     ) $$,
  $$ VALUES ('approved'::text) $$,
  'Owner can re-approve a hidden wish'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'reject',
       'Not appropriate'
     ) $$,
  $$ VALUES ('rejected'::text) $$,
  'Owner can reject an approved wish'
);

SELECT results_eq(
  $$ SELECT deleted_at IS NOT NULL
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'soft_delete'
     ) $$,
  $$ VALUES (true) $$,
  'Owner can soft-delete a wish'
);

SELECT results_eq(
  $$ SELECT deleted_at IS NULL
     FROM public.moderate_wishes(
       ARRAY['a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02']::uuid[],
       'restore'
     ) $$,
  $$ VALUES (true) $$,
  'Owner can restore inside the undo window'
);

SELECT throws_ok(
  $$ SELECT * FROM public.moderate_wishes(
       ARRAY['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01']::uuid[],
       'pin'
     ) $$,
  '22023',
  'PIN_REQUIRES_UNPINNED_APPROVED_WISH',
  'Pending wishes cannot be pinned'
);

SELECT throws_ok(
  $$ SELECT * FROM public.moderate_wishes(
       ARRAY['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01']::uuid[],
       'hide'
     ) $$,
  '22023',
  'INVALID_TRANSITION:hide',
  'Invalid state transition is explicit'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.moderate_wishes(
      ARRAY[
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
        'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b02'
      ]::uuid[],
      'approve'
    )
  ),
  2,
  'Valid bulk action returns every updated wish'
);

SELECT results_eq(
  $$ SELECT moderation_status
     FROM public.wishes
     WHERE id IN (
       'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
       'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b02'
     )
     ORDER BY id $$,
  $$ VALUES ('approved'::text), ('approved'::text) $$,
  'Valid bulk action updates all wishes'
);

SELECT throws_ok(
  $$ SELECT * FROM public.moderate_wishes(
       ARRAY[
         'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
         'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380b04'
       ]::uuid[],
       'pin'
     ) $$,
  '22023',
  'PIN_REQUIRES_UNPINNED_APPROVED_WISH',
  'Invalid member rejects an entire bulk action'
);

SELECT results_eq(
  $$ SELECT is_pinned
     FROM public.wishes
     WHERE id IN (
       'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
       'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380b04'
     )
     ORDER BY id $$,
  $$ VALUES (false), (false) $$,
  'Rejected bulk action leaves every target unchanged'
);

SELECT throws_ok(
  $$ SELECT * FROM public.moderate_wishes(
       ARRAY['b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03']::uuid[],
       'pin',
       NULL,
       jsonb_build_object(
         'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
         '2000-01-01T00:00:00Z'
       )
     ) $$,
  '40001',
  'STALE_WISH_VERSION',
  'Optimistic concurrency rejects a stale version'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.moderation_audit_logs
    WHERE wish_id = 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'
  ),
  8,
  'Every successful single action wrote one audit row'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.moderation_audit_logs
    WHERE wish_id IN (
      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
      'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b02'
    )
  ),
  2,
  'Bulk action wrote one audit row per wish'
);

SELECT ok(
  (
    SELECT old_value ->> 'moderation_status' = 'pending'
      AND new_value ->> 'moderation_status' = 'approved'
      AND actor_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      AND created_at IS NOT NULL
    FROM public.moderation_audit_logs
    WHERE wish_id = 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'
      AND action = 'approve'
    ORDER BY id
    LIMIT 1
  ),
  'Audit captures old/new state, actor, and time'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.moderation_audit_logs
    WHERE wish_id IN (
      'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b03',
      'b4eebc99-9c0b-4ef8-bb6d-6bb9bd380b04'
    )
  ),
  0,
  'Rejected bulk action writes no audit rows'
);

SELECT results_eq(
  $$ SELECT DISTINCT actor_id
     FROM public.moderation_audit_logs
     WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01' $$,
  $$ VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid) $$,
  'Owner can query audit rows for their event'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT is_empty(
  $$ SELECT id
     FROM public.moderation_audit_logs
     WHERE event_id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01' $$,
  'Non-owner cannot read another event audit log'
);

RESET ROLE;

SELECT is(
  (
    SELECT prosecdef
    FROM pg_proc
    WHERE oid = 'public.moderate_wishes(uuid[],text,text,jsonb)'::regprocedure
  ),
  true,
  'Moderation RPC is explicitly security definer'
);

SELECT ok(
  (
    SELECT proconfig @> ARRAY['search_path=""']
    FROM pg_proc
    WHERE oid = 'public.moderate_wishes(uuid[],text,text,jsonb)'::regprocedure
  ),
  'Security definer RPC has an empty search path'
);

ROLLBACK;
