BEGIN;

SELECT plan(12);

RESET ROLE;
SET ROLE service_role;

INSERT INTO public.events (
  id, owner_id, slug, title, visibility, submission_mode
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'media-security-event',
  'Media Security Event',
  'public',
  'approval_required'
);

INSERT INTO storage.objects (bucket_id, name, metadata, created_at)
VALUES (
  'event-media-private',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111111/11111111-1111-4111-8111-111111111111.webp',
  '{"size":1024,"mimetype":"image/webp"}'::jsonb,
  now() - interval '25 hours'
);

INSERT INTO public.media_upload_sessions (
  event_id, client_request_id, storage_path, asset_role, media_type,
  mime_type, max_size_bytes, expires_at
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111111/11111111-1111-4111-8111-111111111111.webp',
  'wish_media',
  'image',
  'image/webp',
  5242880,
  now() + interval '2 hours'
);

INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '11111111-1111-4111-8111-111111111101',
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111111',
  'Media Sender',
  'Media wish',
  'pending'
);

SELECT lives_ok(
  $$
    INSERT INTO public.wish_media (
      wish_id, storage_bucket, storage_path, media_type, mime_type, size_bytes
    )
    VALUES (
      '11111111-1111-4111-8111-111111111101',
      'event-media-private',
      '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111111/11111111-1111-4111-8111-111111111111.webp',
      'image',
      'image/webp',
      1024
    )
  $$,
  'A matching upload session and object are accepted'
);

SELECT isnt(
  (SELECT consumed_at FROM public.media_upload_sessions
   WHERE client_request_id = 'c1011111-1111-4111-8111-111111111111'),
  NULL,
  'A successful media link consumes the upload session'
);

SELECT is(
  (SELECT size_bytes FROM public.wish_media
   WHERE wish_id = '11111111-1111-4111-8111-111111111101'),
  1024::bigint,
  'Stored media size comes from the validated request'
);

INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES (
  'event-media-private',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111112/22222222-2222-4222-8222-222222222222.webp',
  '{"size":1024,"mimetype":"image/webp"}'::jsonb
);
INSERT INTO public.media_upload_sessions (
  event_id, client_request_id, storage_path, asset_role, media_type,
  mime_type, max_size_bytes, expires_at
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111112',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111112/22222222-2222-4222-8222-222222222222.webp',
  'wish_media',
  'image',
  'image/webp',
  5242880,
  now() + interval '2 hours'
);
INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '22222222-2222-4222-8222-222222222202',
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111112',
  'Mismatch Sender',
  'Mismatch wish',
  'pending'
);

SELECT throws_ok(
  $$
    INSERT INTO public.wish_media (
      wish_id, storage_bucket, storage_path, media_type, mime_type, size_bytes
    )
    VALUES (
      '22222222-2222-4222-8222-222222222202',
      'event-media-private',
      '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111112/22222222-2222-4222-8222-222222222222.webp',
      'image',
      'image/webp',
      2048
    )
  $$,
  'P0001',
  NULL,
  'A client size mismatch is rejected'
);

INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES (
  'event-media-private',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111113/33333333-3333-4333-8333-333333333333.webp',
  '{"size":1024,"mimetype":"image/webp"}'::jsonb
);
INSERT INTO public.media_upload_sessions (
  event_id, client_request_id, storage_path, asset_role, media_type,
  mime_type, max_size_bytes, expires_at
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111113',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111113/33333333-3333-4333-8333-333333333333.webp',
  'wish_media',
  'image',
  'image/webp',
  5242880,
  now() - interval '1 minute'
);
INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '33333333-3333-4333-8333-333333333303',
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111113',
  'Expired Sender',
  'Expired wish',
  'pending'
);

SELECT throws_ok(
  $$
    INSERT INTO public.wish_media (
      wish_id, storage_bucket, storage_path, media_type, mime_type, size_bytes
    )
    VALUES (
      '33333333-3333-4333-8333-333333333303',
      'event-media-private',
      '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111113/33333333-3333-4333-8333-333333333333.webp',
      'image',
      'image/webp',
      1024
    )
  $$,
  'P0001',
  NULL,
  'An expired upload session is rejected'
);

INSERT INTO storage.objects (bucket_id, name, metadata)
VALUES (
  'event-media-private',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111114/avatar_44444444-4444-4444-8444-444444444444.webp',
  '{"size":512,"mimetype":"image/webp"}'::jsonb
);
INSERT INTO public.media_upload_sessions (
  event_id, client_request_id, storage_path, asset_role, media_type,
  mime_type, max_size_bytes, expires_at
)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111114',
  '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111114/avatar_44444444-4444-4444-8444-444444444444.webp',
  'sender_avatar',
  'image',
  'image/webp',
  5242880,
  now() + interval '2 hours'
);
INSERT INTO public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
VALUES (
  '44444444-4444-4444-8444-444444444404',
  '00000000-0000-0000-0000-000000000101',
  'c1011111-1111-4111-8111-111111111114',
  'Avatar Sender',
  'Avatar wish',
  'approved'
);

SELECT lives_ok(
  $$
    UPDATE public.wishes
    SET sender_avatar_path = '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111114/avatar_44444444-4444-4444-8444-444444444444.webp'
    WHERE id = '44444444-4444-4444-8444-444444444404'
  $$,
  'A matching avatar session is accepted'
);

SELECT is(
  (SELECT count(*) FROM public.get_media_to_cleanup()
   WHERE storage_path LIKE '%avatar_44444444%'),
  0::bigint,
  'Cleanup does not classify a linked avatar as an orphan'
);

SELECT lives_ok(
  $$
    SELECT public.create_media_upload_session(
      '00000000-0000-0000-0000-000000000101',
      'c1011111-1111-4111-8111-111111111115',
      'event-media-private',
      '00000000-0000-0000-0000-000000000101/c1011111-1111-4111-8111-111111111115/55555555-5555-4555-8555-555555555555.webp',
      'wish_media',
      'image',
      'image/webp',
      5242880,
      now() + interval '2 hours'
    )
  $$,
  'Upload session creation reserves quota atomically'
);

SELECT is(
  (SELECT media_reserved_bytes FROM public.events
   WHERE id = '00000000-0000-0000-0000-000000000101'),
  5242880::bigint,
  'Upload reservation is reflected in event quota state'
);

DELETE FROM public.media_upload_sessions
WHERE client_request_id = 'c1011111-1111-4111-8111-111111111115';

SELECT is(
  (SELECT media_reserved_bytes FROM public.events
   WHERE id = '00000000-0000-0000-0000-000000000101'),
  0::bigint,
  'Deleting an unconsumed session releases its reservation'
);

RESET ROLE;
SET ROLE anon;
SELECT throws_ok(
  $$ SELECT * FROM public.get_media_to_cleanup() $$,
  '42501',
  NULL,
  'Anonymous callers cannot execute cleanup RPC'
);

SELECT throws_ok(
  $$ SELECT * FROM public.media_upload_sessions $$,
  '42501',
  NULL,
  'Anonymous callers cannot read upload sessions'
);

SELECT * FROM finish();
ROLLBACK;
