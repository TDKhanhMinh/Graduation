BEGIN;

SELECT plan(11);

RESET ROLE;
SET ROLE service_role;

INSERT INTO public.events (id, owner_id, slug, title, visibility, submission_mode)
VALUES
  ('55555555-5555-4555-8555-555555555501', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'poster-owner-event', 'Poster Owner Event', 'private', 'approval_required'),
  ('55555555-5555-4555-8555-555555555502', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'poster-other-event', 'Poster Other Event', 'private', 'approval_required');

INSERT INTO public.poster_documents (
  id, event_id, document_version, template_id, template_version, ratio, document_json
)
VALUES (
  '55555555-5555-4555-8555-555555555511',
  '55555555-5555-4555-8555-555555555501',
  1,
  'graduation-glow',
  1,
  '4:5',
  '{"version":1,"metadata":{"eventId":"55555555-5555-4555-8555-555555555501"}}'::jsonb
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT results_eq(
  $$ SELECT event_id FROM public.poster_documents $$,
  $$ VALUES ('55555555-5555-4555-8555-555555555501'::uuid) $$,
  'Owner can read the poster document for their event'
);

SELECT lives_ok(
  $$ UPDATE public.poster_documents
     SET revision = 2
     WHERE event_id = '55555555-5555-4555-8555-555555555501' $$,
  'Owner can update their poster document'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT is_empty(
  $$ SELECT id FROM public.poster_documents $$,
  'Non-owner cannot read another event poster'
);

SELECT is_empty(
  $$ UPDATE public.poster_documents SET revision = 99 RETURNING id $$,
  'Non-owner cannot update another event poster'
);

SELECT is_empty(
  $$ DELETE FROM public.poster_documents RETURNING id $$,
  'Non-owner cannot delete another event poster'
);

RESET ROLE;
SET ROLE anon;

SELECT throws_ok(
  $$ SELECT * FROM public.poster_documents $$,
  '42501',
  NULL,
  'Anonymous callers cannot read poster documents'
);

SELECT throws_ok(
  $$ SELECT public.create_poster_asset_upload_session(
    '55555555-5555-4555-8555-555555555501',
    '55555555-5555-4555-8555-555555555511',
    '55555555-5555-4555-8555-555555555521',
    '55555555-5555-4555-8555-555555555501/55555555-5555-4555-8555-555555555511/55555555-5555-4555-8555-555555555521.png',
    'image/png', 1024, now() + interval '1 hour'
  ) $$,
  '42501',
  NULL,
  'Anonymous callers cannot create poster upload sessions'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

SELECT throws_ok(
  $$ SELECT public.create_poster_asset_upload_session(
    '55555555-5555-4555-8555-555555555501',
    '55555555-5555-4555-8555-555555555511',
    '55555555-5555-4555-8555-555555555521',
    '55555555-5555-4555-8555-555555555501/55555555-5555-4555-8555-555555555511/55555555-5555-4555-8555-555555555521.png',
    'image/png', 1024, now() + interval '1 hour'
  ) $$,
  'P0001',
  'POSTER_EVENT_FORBIDDEN',
  'Non-owner cannot create poster upload sessions'
);

RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

SELECT throws_ok(
  $$ SELECT public.create_poster_asset_upload_session(
    '55555555-5555-4555-8555-555555555501',
    '55555555-5555-4555-8555-555555555511',
    '55555555-5555-4555-8555-555555555522',
    '55555555-5555-4555-8555-555555555501/55555555-5555-4555-8555-555555555511/55555555-5555-4555-8555-555555555522.png',
    'image/gif', 1024, now() + interval '1 hour'
  ) $$,
  'P0001',
  'POSTER_UPLOAD_CONTRACT_INVALID',
  'Invalid poster MIME types are rejected'
);

RESET ROLE;
SET ROLE service_role;

SELECT throws_ok(
  $$ INSERT INTO public.poster_assets (
       document_id, event_id, asset_id, asset_role, storage_path, mime_type, size_bytes
     ) VALUES (
       '55555555-5555-4555-8555-555555555511',
       '55555555-5555-4555-8555-555555555501',
       'upload-1', 'upload', 'original-user-file.png', 'image/png', 1024
     ) $$,
  '23514',
  NULL,
  'User-provided filenames cannot become poster storage paths'
);

RESET ROLE;
SET ROLE anon;

SELECT throws_ok(
  $$ SELECT * FROM public.get_poster_assets_to_cleanup() $$,
  '42501',
  NULL,
  'Anonymous callers cannot execute poster cleanup'
);

SELECT * FROM finish();
ROLLBACK;
