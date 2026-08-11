BEGIN;

SELECT plan(15);

SELECT has_function('public', 'get_owner_export_rows', ARRAY['uuid', 'integer']::name[], 'owner export RPC exists');
SELECT function_lang_is('public', 'get_owner_export_rows', ARRAY['uuid', 'integer']::name[], 'sql', 'owner export remains SQL');
SELECT is((SELECT prosecdef FROM pg_proc WHERE oid = 'public.get_owner_export_rows(uuid,integer)'::regprocedure), false, 'owner export keeps SECURITY INVOKER');
SELECT is_empty(
  $$SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_schema = 'public'
      AND routine_name = 'get_owner_export_rows'
      AND grantee IN ('anon', 'public')$$,
  'anon and PUBLIC cannot execute owner export RPC'
);
SELECT has_schema('public', 'public schema exists');
SELECT has_table('public', 'events', 'events table exists for owner export');
SELECT has_table('public', 'wishes', 'wishes table exists for owner export');
SELECT ok(
  pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) LIKE '%moderation_status = ''approved''%'
    AND pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) LIKE '%deleted_at IS NULL%',
  'owner export filters approved, non-deleted wishes'
);
SELECT ok(
  pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) LIKE '%e.owner_id = (SELECT auth.uid())%',
  'owner export has an explicit owner predicate'
);
SELECT ok(
  pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) LIKE '%LIMIT LEAST(GREATEST(COALESCE(p_limit, 901), 1), 901)%',
  'owner export clamps the snapshot size'
);
SELECT ok(
  pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) NOT LIKE '%actor_key_hash%'
    AND pg_get_functiondef('public.get_owner_export_rows(uuid,integer)'::regprocedure) NOT LIKE '%storage_path%',
  'owner export projection excludes actor hashes and storage paths'
);
SELECT ok(
  array_to_string((SELECT proconfig FROM pg_proc WHERE oid = 'public.get_owner_export_rows(uuid,integer)'::regprocedure), ',') LIKE '%search_path=%',
  'owner export pins search_path'
);

RESET ROLE;
INSERT INTO auth.users (id, email, aud, role, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 'rm26-owner@example.test', 'authenticated', 'authenticated', now(), now()),
  ('a1000000-0000-4000-8000-000000000002', 'rm26-other@example.test', 'authenticated', 'authenticated', now(), now());

SET ROLE service_role;
INSERT INTO public.events (id, owner_id, slug, title, visibility, submission_mode)
VALUES (
  'a1000000-0000-4000-8000-000000000010',
  'a1000000-0000-4000-8000-000000000001',
  'rm26-p2-t01-fixture',
  'P2 export fixture',
  'unlisted',
  'approval_required'
);
INSERT INTO public.wishes (id, event_id, client_request_id, sender_name, content, moderation_status, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000021', 'Approved', 'Included', 'approved', now(), now()),
  ('a1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000022', 'Pending', 'Excluded', 'pending', now(), now()),
  ('a1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000023', 'Deleted', 'Excluded', 'approved', now(), now());
UPDATE public.wishes
SET deleted_at = now()
WHERE id = 'a1000000-0000-4000-8000-000000000013';
RESET ROLE;

SET ROLE authenticated;
SET request.jwt.claim.sub = 'a1000000-0000-4000-8000-000000000001';
SELECT is(
  (SELECT count(*)::integer FROM public.get_owner_export_rows('a1000000-0000-4000-8000-000000000010', 901)),
  1,
  'owner sees only active approved wishes'
);
SET request.jwt.claim.sub = 'a1000000-0000-4000-8000-000000000002';
SELECT is(
  (SELECT count(*)::integer FROM public.get_owner_export_rows('a1000000-0000-4000-8000-000000000010', 901)),
  0,
  'non-owner cannot read export rows'
);
RESET ROLE;
SET ROLE anon;
SELECT throws_ok(
  $$SELECT * FROM public.get_owner_export_rows('a1000000-0000-4000-8000-000000000010', 901)$$,
  '42501',
  NULL,
  'anon cannot execute owner export RPC'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;