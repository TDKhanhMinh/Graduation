BEGIN;

SELECT plan(23);

SELECT has_function('public', 'get_event_insights', ARRAY['uuid', 'timestamptz', 'timestamptz', 'text', 'text']::name[], 'event insights RPC exists');
SELECT function_lang_is('public', 'get_event_insights', ARRAY['uuid', 'timestamptz', 'timestamptz', 'text', 'text']::name[], 'plpgsql', 'event insights is plpgsql');
SELECT is((SELECT prosecdef FROM pg_proc WHERE oid = 'public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure), true, 'aggregate RPC is SECURITY DEFINER for service-only source tables');
SELECT is_empty(
  $$SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_schema = 'public'
      AND routine_name = 'get_event_insights'
      AND grantee IN ('anon', 'public', 'service_role')$$,
  'aggregate RPC is not executable by anon, PUBLIC, or service_role'
);
SELECT ok(
  array_to_string((SELECT proconfig FROM pg_proc WHERE oid = 'public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure), ',') LIKE '%search_path=%',
  'aggregate RPC pins search_path'
);
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%auth.uid()%'
    AND pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%e.owner_id%',
  'aggregate RPC checks the authenticated event owner'
);
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%p_range_end > p_range_start + interval ''366 days''%',
  'aggregate RPC bounds the range to 366 days'
);
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%pg_timezone_names%',
  'aggregate RPC validates IANA timezone names'
);
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%generate_series%',
  'aggregate RPC zero-fills day buckets'
);
SELECT ok(to_regclass('public.idx_wishes_event_created_at_rm26') IS NOT NULL, 'wish aggregate index exists');
SELECT ok(to_regclass('public.idx_wish_reactions_wish_created_at_rm26') IS NOT NULL, 'reaction aggregate index exists');
SELECT ok(to_regclass('public.idx_wish_media_wish_created_at_rm26') IS NOT NULL, 'media aggregate index exists');
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) NOT LIKE '%sender_name%'
    AND pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) NOT LIKE '%actor_key_hash%'
    AND pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) NOT LIKE '%storage_path%',
  'aggregate response does not select raw identity or storage fields'
);
SELECT ok(
  pg_get_functiondef('public.get_event_insights(uuid,timestamptz,timestamptz,text,text)'::regprocedure) LIKE '%jsonb_build_object%',
  'aggregate response is JSON contract data'
);

RESET ROLE;
SET LOCAL session_replication_role = replica;
INSERT INTO auth.users (id, email, aud, role, created_at, updated_at)
VALUES
  ('a3000000-0000-4000-8000-000000000001', 'rm26-insights-owner@example.test', 'authenticated', 'authenticated', now(), now()),
  ('a3000000-0000-4000-8000-000000000002', 'rm26-insights-other@example.test', 'authenticated', 'authenticated', now(), now());

SET ROLE service_role;
INSERT INTO public.events (id, owner_id, slug, title, visibility, submission_mode, created_at, updated_at)
VALUES (
  'a3000000-0000-4000-8000-000000000010',
  'a3000000-0000-4000-8000-000000000001',
  'rm26-p2-t03-fixture',
  'P2 insights fixture',
  'unlisted',
  'approval_required',
  '2026-01-01T00:00:00Z',
  '2026-01-01T00:00:00Z'
);
INSERT INTO public.wishes (id, event_id, client_request_id, sender_name, content, moderation_status, created_at, updated_at)
VALUES
  ('a3000000-0000-4000-8000-000000000011', 'a3000000-0000-4000-8000-000000000010', 'a3000000-0000-4000-8000-000000000021', 'Approved', 'Aggregate only', 'approved', '2026-01-01T12:00:00Z', '2026-01-01T12:00:00Z'),
  ('a3000000-0000-4000-8000-000000000012', 'a3000000-0000-4000-8000-000000000010', 'a3000000-0000-4000-8000-000000000022', 'Pending', 'Aggregate only', 'pending', '2026-01-02T12:00:00Z', '2026-01-02T12:00:00Z');
INSERT INTO public.wish_media (wish_id, storage_bucket, storage_path, media_type, mime_type, size_bytes, processing_status, created_at)
VALUES (
  'a3000000-0000-4000-8000-000000000011',
  'event-media-private',
  'rm26-p2-t03-fixture/image.png',
  'image',
  'image/png',
  10,
  'ready',
  '2026-01-01T12:00:00Z'
);
INSERT INTO public.wish_reactions (wish_id, actor_id, emoji, created_at)
VALUES (
  'a3000000-0000-4000-8000-000000000011',
  'a3000000-0000-4000-8000-000000000001',
  chr(127891),
  '2026-01-01T12:00:00Z'
);
RESET ROLE;
SET LOCAL session_replication_role = DEFAULT;

SET ROLE authenticated;
SET request.jwt.claim.sub = 'a3000000-0000-4000-8000-000000000001';
SELECT is(
  (SELECT (public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'summary'->>'total')::integer),
  2,
  'owner summary includes two non-deleted wishes'
);
SELECT is(
  (SELECT (public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'summary'->>'approved')::integer),
  1,
  'owner summary separates approved wishes'
);
SELECT is(
  (SELECT (public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'media'->>'total')::integer),
  1,
  'owner aggregate includes ready media count only'
);
SELECT is(
  (SELECT (public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'reactions'->>'total')::integer),
  1,
  'owner aggregate includes approved-wish reactions'
);
SELECT is(
  (SELECT jsonb_array_length(public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'trend')),
  2,
  'owner aggregate zero-fills two daily buckets'
);
SELECT is(
  (SELECT (public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')->'trend'->0->>'total')::integer),
  1,
  'first daily bucket contains the first wish'
);
SET request.jwt.claim.sub = 'a3000000-0000-4000-8000-000000000002';
SELECT throws_ok(
  $$SELECT public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z', 'UTC', 'day')$$,
  '42501',
  'INSIGHTS_FORBIDDEN',
  'non-owner cannot read aggregate insights'
);
SET request.jwt.claim.sub = 'a3000000-0000-4000-8000-000000000001';
SELECT throws_ok(
  $$SELECT public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-01-01T00:00:00Z', '2027-01-03T00:00:00Z', 'UTC', 'day')$$,
  '22023',
  'INSIGHTS_RANGE_INVALID',
  'aggregate range cannot exceed 366 days'
);
SELECT is(
  (SELECT jsonb_array_length(public.get_event_insights('a3000000-0000-4000-8000-000000000010', '2026-03-08T05:00:00Z', '2026-03-09T04:00:00Z', 'America/New_York', 'day')->'trend')),
  1,
  'DST range produces one deterministic local day bucket'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;