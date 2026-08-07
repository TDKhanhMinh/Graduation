BEGIN;

SELECT plan(8);

RESET ROLE;
SET ROLE service_role;

INSERT INTO public.events (
  id, owner_id, slug, title, visibility, submission_mode, deleted_at, updated_at
)
VALUES
  (
    '66666666-6666-4666-8666-666666666601',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'deleted-retention-event',
    'Deleted Retention Event',
    'public',
    'approval_required',
    now() - interval '31 days',
    now() - interval '31 days'
  ),
  (
    '66666666-6666-4666-8666-666666666602',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'live-retention-event',
    'Live Retention Event',
    'public',
    'approval_required'
  );

INSERT INTO storage.objects (bucket_id, name, metadata, created_at)
VALUES
  (
    'event-media-private',
    '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666621.webp',
    '{size:2048}'::jsonb,
    now() - interval '31 days'
  ),
  (
    'poster-assets-private',
    '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666631.png',
    '{size:4096}'::jsonb,
    now() - interval '31 days'
  ),
  (
    'poster-assets-private',
    '66666666-6666-4666-8666-666666666602/66666666-6666-4666-8666-666666666612/66666666-6666-4666-8666-666666666632.png',
    '{size:4096}'::jsonb,
    now() - interval '31 days'
  );

INSERT INTO public.media_upload_sessions (
  event_id, client_request_id, storage_path, asset_role, media_type,
  mime_type, max_size_bytes, expires_at
)
VALUES (
  '66666666-6666-4666-8666-666666666601',
  '66666666-6666-4666-8666-666666666611',
  '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666621.webp',
  'wish_media',
  'image',
  'image/webp',
  4096,
  now() + interval '1 hour'
);

INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status,
  updated_at
)
VALUES (
  '66666666-6666-4666-8666-666666666641',
  '66666666-6666-4666-8666-666666666601',
  '66666666-6666-4666-8666-666666666611',
  'Deleted Sender',
  'Deleted event wish',
  'approved',
  now() - interval '31 days'
);

INSERT INTO public.wish_media (
  wish_id, storage_bucket, storage_path, media_type, mime_type, size_bytes
)
VALUES (
  '66666666-6666-4666-8666-666666666641',
  'event-media-private',
  '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666621.webp',
  'image',
  'image/webp',
  2048
);

INSERT INTO public.poster_documents (
  id, event_id, template_id, template_version, ratio, document_json
)
VALUES (
  '66666666-6666-4666-8666-666666666611',
  '66666666-6666-4666-8666-666666666601',
  'graduation-glow',
  1,
  '4:5',
  '{version:1}'::jsonb
);

INSERT INTO public.poster_assets (
  document_id, event_id, asset_id, asset_role, storage_path, mime_type, size_bytes
)
VALUES (
  '66666666-6666-4666-8666-666666666611',
  '66666666-6666-4666-8666-666666666601',
  'deleted-poster-asset',
  'export',
  '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666631.png',
  'image/png',
  4096
);

INSERT INTO public.poster_documents (
  id, event_id, template_id, template_version, ratio, document_json
)
VALUES (
  '66666666-6666-4666-8666-666666666612',
  '66666666-6666-4666-8666-666666666602',
  'graduation-glow',
  1,
  '4:5',
  '{version:1}'::jsonb
);

INSERT INTO public.poster_assets (
  document_id, event_id, asset_id, asset_role, storage_path, mime_type, size_bytes
)
VALUES (
  '66666666-6666-4666-8666-666666666612',
  '66666666-6666-4666-8666-666666666602',
  'live-poster-asset',
  'export',
  '66666666-6666-4666-8666-666666666602/66666666-6666-4666-8666-666666666612/66666666-6666-4666-8666-666666666632.png',
  'image/png',
  4096
);

INSERT INTO public.realtime_wall_events (event_id, wish_id, action, payload)
VALUES (
  '66666666-6666-4666-8666-666666666601',
  '66666666-6666-4666-8666-666666666641',
  'upsert',
  '{id:66666666-6666-4666-8666-666666666641}'::jsonb
);

RESET ROLE;
SET ROLE anon;

SELECT is_empty(
  $$ SELECT id
     FROM public.public_wishes_view
     WHERE event_id = '66666666-6666-4666-8666-666666666601' $$,
  'Deleted event wishes are not publicly readable'
);

SELECT is_empty(
  $$ SELECT id
     FROM public.realtime_wall_events
     WHERE event_id = '66666666-6666-4666-8666-666666666601' $$,
  'Deleted event realtime rows are not publicly readable'
);

SELECT throws_ok(
  $$ SELECT * FROM public.get_media_to_cleanup() $$,
  '42501',
  NULL,
  'Anonymous callers cannot execute media cleanup'
);

SELECT throws_ok(
  $$ SELECT * FROM public.get_poster_assets_to_cleanup() $$,
  '42501',
  NULL,
  'Anonymous callers cannot execute poster cleanup'
);

RESET ROLE;
SET ROLE service_role;

SELECT results_eq(
  $$ SELECT cleanup_type
     FROM public.get_media_to_cleanup()
     WHERE storage_path = '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666621.webp' $$,
  $$ VALUES ('event_deleted_media') $$,
  'Deleted event media enters the retention queue'
);

SELECT results_eq(
  $$ SELECT storage_path
     FROM public.get_poster_assets_to_cleanup()
     WHERE storage_path = '66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666631.png' $$,
  $$ VALUES ('66666666-6666-4666-8666-666666666601/66666666-6666-4666-8666-666666666611/66666666-6666-4666-8666-666666666631.png') $$,
  'Deleted event poster assets enter the retention queue'
);

SELECT is_empty(
  $$ SELECT storage_path
     FROM public.get_poster_assets_to_cleanup()
     WHERE storage_path = '66666666-6666-4666-8666-666666666602/66666666-6666-4666-8666-666666666612/66666666-6666-4666-8666-666666666632.png' $$,
  'Live event poster assets are excluded from deleted-event cleanup'
);

SELECT is_empty(
  $$ SELECT m.id
     FROM public.wish_media m
     LEFT JOIN public.wishes w ON w.id = m.wish_id
     LEFT JOIN public.events e ON e.id = w.event_id
     WHERE e.id IS NULL $$,
  'Retention fixtures do not create child rows without an event parent'
);

SELECT * FROM finish();
ROLLBACK;
