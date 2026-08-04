import {
  countUrls,
  parseSubmitWishRequest,
} from '../_shared/submission.ts';
import { verifyCaptcha } from '../_shared/captcha.ts';
import { hasValidMediaMagicBytes } from '../_shared/media.ts';

function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}

const validRequest = {
  eventId: 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01',
  clientRequestId: 'c9eebc99-9c0b-4ef8-bb6d-6bb9bd380c09',
  senderName: '  Graduation Guest  ',
  content: '  Congratulations!\r\nBest wishes.  ',
  captchaToken: 'test-token',
  deviceKey: 'device-key-1234567890',
};

Deno.test('submission schema normalizes valid text input', () => {
  const parsed = parseSubmitWishRequest(validRequest);
  assert(parsed.success);
  assert(parsed.data.senderName === 'Graduation Guest');
  assert(parsed.data.content === 'Congratulations!\nBest wishes.');
});

Deno.test('submission schema rejects server-owned moderation fields', () => {
  const parsed = parseSubmitWishRequest({
    ...validRequest,
    moderationStatus: 'approved',
    isPinned: true,
  });
  assert(!parsed.success);
  assert(parsed.issues.some((issue) => issue.code === 'SERVER_OWNED_FIELD'));
});

Deno.test('submission schema accepts verified-shape image media and avatar paths', () => {
  const parsed = parseSubmitWishRequest({
    ...validRequest,
    media: {
      path: validRequest.eventId + "/" + validRequest.clientRequestId + "/11111111-1111-4111-8111-111111111111.webp",
      type: 'image',
      mimeType: 'image/webp',
      sizeBytes: 1024,
      width: 800,
      height: 600,
    },
    senderAvatarPath: validRequest.eventId + "/" + validRequest.clientRequestId + "/avatar_22222222-2222-4222-8222-222222222222.webp",
  });
  assert(parsed.success);
  assert(parsed.data.media?.type === 'image');
  assert(parsed.data.senderAvatarPath?.includes('avatar_'));
});

Deno.test('submission schema rejects spoofed media fields and legacy provider URLs', () => {
  const parsed = parseSubmitWishRequest({
    ...validRequest,
    media: {
      path: 'https://res.cloudinary.com/example/image/upload/file.webp',
      type: 'image',
      mimeType: 'image/webp',
      sizeBytes: 1024,
    },
  });
  assert(!parsed.success);
  assert(parsed.issues.some((issue) => issue.code === 'INVALID_MEDIA'));
});

Deno.test('submission schema rejects mediaPath payload drift', () => {
  const parsed = parseSubmitWishRequest({
    ...validRequest,
    mediaPath: 'event/path/file.webp',
  });
  assert(!parsed.success);
  assert(parsed.issues.some((issue) => issue.code === 'UNKNOWN_FIELD'));
});

Deno.test('media validator accepts matching image and audio signatures', () => {
  assert(hasValidMediaMagicBytes(
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    'image',
    'image/png',
  ));
  assert(hasValidMediaMagicBytes(
    new Uint8Array([0x49, 0x44, 0x33, 0x04]),
    'audio',
    'audio/mpeg',
  ));
  assert(hasValidMediaMagicBytes(
    new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]),
    'audio',
    'audio/webm',
  ));
});

Deno.test('media validator rejects a MIME and magic-byte mismatch', () => {
  assert(!hasValidMediaMagicBytes(
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    'image',
    'image/jpeg',
  ));
});

Deno.test('submission schema rejects more than two links', () => {
  const parsed = parseSubmitWishRequest({
    ...validRequest,
    content: 'https://one.test https://two.test https://three.test',
  });
  assert(!parsed.success);
  assert(parsed.issues.some((issue) => issue.code === 'TOO_MANY_URLS'));
  assert(countUrls(validRequest.content) === 0);
});

Deno.test('CAPTCHA verifier supports an explicit local-only bypass token', async () => {
  const result = await verifyCaptcha({
    token: 'local-bypass',
    remoteIp: '127.0.0.1',
    idempotencyKey: validRequest.clientRequestId,
    secret: '',
    bypassToken: 'local-bypass',
  });
  assert(result.success);
});

Deno.test('CAPTCHA verifier fails closed when its secret is missing', async () => {
  const result = await verifyCaptcha({
    token: 'real-token',
    remoteIp: '127.0.0.1',
    idempotencyKey: validRequest.clientRequestId,
    secret: '',
  });
  assert(!result.success);
  assert(result.errorCodes.includes('missing-secret'));
});

Deno.test('CAPTCHA verifier checks expected hostname and action', async () => {
  const fetcher = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          success: true,
          hostname: 'example.test',
          action: 'submit_wish',
        }),
        { status: 200 }
      )
    );

  const result = await verifyCaptcha({
    token: 'real-token',
    remoteIp: '127.0.0.1',
    idempotencyKey: validRequest.clientRequestId,
    secret: 'secret',
    expectedHostname: 'example.test',
    fetcher,
  });
  assert(result.success);
});
