import { createClient } from '@supabase/supabase-js';

import { verifyCaptcha } from '../_shared/captcha.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createRequestContext, logger, requestDurationMs } from '../_shared/logger.ts';
import { validateUploadedMedia } from '../_shared/media.ts';
import { getClientIp, hashIdentifier } from '../_shared/security.ts';
import { parseSubmitWishRequest } from '../_shared/submission.ts';

const MAX_BODY_BYTES = 16 * 1024;
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' };

type TransactionResult = {
  wish_id: string | null;
  moderation_status: 'pending' | 'approved' | null;
  created_at: string | null;
  was_duplicate: boolean;
  result_code:
    | 'OK'
    | 'EVENT_NOT_FOUND'
    | 'EVENT_UNAVAILABLE'
    | 'EVENT_CLOSED'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED';
  retry_after_seconds: number;
  max_wish_length: number | null;
};

const response = (
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  extraHeaders: Record<string, string> = {}
) =>
  new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });

const errorResponse = (
  code: string,
  message: string,
  status: number,
  requestId: string,
  details?: Record<string, unknown>,
  extraHeaders?: Record<string, string>
) =>
  response(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    status,
    requestId,
    extraHeaders
  );

const readJsonBody = async (req: Request) => {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new Error('BODY_TOO_LARGE');
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    throw new Error('INVALID_JSON');
  }
};

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const context = createRequestContext(req);
  let resultCode = 'INTERNAL_SERVER_ERROR';

  try {
    if (req.method !== 'POST') {
      resultCode = 'METHOD_NOT_ALLOWED';
      return errorResponse(
        resultCode,
        'Only POST requests are supported.',
        405,
        context.requestId,
        undefined,
        { Allow: 'POST, OPTIONS' }
      );
    }

    if (!req.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      resultCode = 'UNSUPPORTED_MEDIA_TYPE';
      return errorResponse(
        resultCode,
        'Content-Type must be application/json.',
        415,
        context.requestId
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await readJsonBody(req);
    } catch (error) {
      resultCode = error instanceof Error ? error.message : 'INVALID_JSON';
      const bodyTooLarge = resultCode === 'BODY_TOO_LARGE';
      return errorResponse(
        resultCode,
        bodyTooLarge ? 'Request body is too large.' : 'Request body is not valid JSON.',
        bodyTooLarge ? 413 : 400,
        context.requestId
      );
    }

    const parsed = parseSubmitWishRequest(rawBody);
    if (!parsed.success) {
      resultCode = 'VALIDATION_ERROR';
      return errorResponse(
        resultCode,
        'Submission data is invalid.',
        400,
        context.requestId,
        { issues: parsed.issues.map(({ field, code }) => ({ field, code })) }
      );
    }

    const clientIp = getClientIp(req);
    const rateLimitSalt = Deno.env.get('WISH_RATE_LIMIT_SALT') ?? '';
    const [ipHash, deviceHash] = await Promise.all([
      hashIdentifier(clientIp, rateLimitSalt),
      hashIdentifier(parsed.data.deviceKey, rateLimitSalt),
    ]);

    const captcha = await verifyCaptcha({
      token: parsed.data.captchaToken,
      remoteIp: clientIp,
      idempotencyKey: parsed.data.clientRequestId,
      secret: Deno.env.get('TURNSTILE_SECRET_KEY') ?? '',
      expectedHostname: Deno.env.get('TURNSTILE_EXPECTED_HOSTNAME') || undefined,
      bypassToken: Deno.env.get('CAPTCHA_BYPASS_TOKEN') || undefined,
    });

    if (!captcha.success) {
      resultCode = 'CAPTCHA_FAILED';
      return errorResponse(
        resultCode,
        'CAPTCHA verification failed. Please retry with a new challenge.',
        400,
        context.requestId,
        { retryable: true }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase function environment');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (parsed.data.media) {
      const mediaValidation = await validateUploadedMedia(
        supabase,
        parsed.data.media.path,
        parsed.data.media.type,
        parsed.data.media.mimeType,
      );
      if (!mediaValidation.valid) {
        resultCode = mediaValidation.code;
        return errorResponse(
          mediaValidation.code,
          'Uploaded media could not be verified.',
          400,
          context.requestId,
        );
      }
    }

    if (parsed.data.senderAvatarPath) {
      const avatarValidation = await validateUploadedMedia(
        supabase,
        parsed.data.senderAvatarPath,
        'image',
      );
      if (!avatarValidation.valid) {
        resultCode = avatarValidation.code;
        return errorResponse(
          avatarValidation.code,
          'Uploaded avatar could not be verified.',
          400,
          context.requestId,
        );
      }
    }

    const { data, error } = await supabase.rpc('submit_wish_transaction', {
      p_event_id: parsed.data.eventId,
      p_client_request_id: parsed.data.clientRequestId,
      p_sender_name: parsed.data.senderName,
      p_content: parsed.data.content,
      p_ip_hash: ipHash,
      p_device_hash: deviceHash,
      p_media_path: parsed.data.media?.path || null,
      p_media_type: parsed.data.media?.type || null,
      p_media_mime_type: parsed.data.media?.mimeType || null,
      p_media_size_bytes: parsed.data.media?.sizeBytes || null,
      p_media_duration_ms: parsed.data.media?.durationMs || null,
      p_media_width: parsed.data.media?.width || null,
      p_media_height: parsed.data.media?.height || null,
      p_sender_avatar_path: parsed.data.senderAvatarPath || null,
    });

    if (error || !Array.isArray(data) || data.length !== 1) {
      throw error ?? new Error('Unexpected transaction response');
    }

    const outcome = data[0] as TransactionResult;
    resultCode = outcome.result_code;

    if (outcome.result_code === 'EVENT_NOT_FOUND' || outcome.result_code === 'EVENT_UNAVAILABLE') {
      return errorResponse(
        'EVENT_UNAVAILABLE',
        'This event is not available for guest submissions.',
        404,
        context.requestId
      );
    }

    if (outcome.result_code === 'EVENT_CLOSED') {
      return errorResponse(
        outcome.result_code,
        'This event is not accepting new wishes.',
        409,
        context.requestId,
        { retryable: false }
      );
    }

    if (outcome.result_code === 'VALIDATION_ERROR') {
      return errorResponse(
        outcome.result_code,
        'Submission does not satisfy the event limits.',
        400,
        context.requestId,
        outcome.max_wish_length
          ? { maxWishLength: outcome.max_wish_length }
          : undefined
      );
    }

    if (outcome.result_code === 'RATE_LIMITED') {
      const retryAfter = Math.max(1, outcome.retry_after_seconds);
      return errorResponse(
        outcome.result_code,
        'Too many submissions. Please try again later.',
        429,
        context.requestId,
        { retryable: true, retryAfterSeconds: retryAfter },
        { 'Retry-After': String(retryAfter) }
      );
    }

    if (!outcome.wish_id || !outcome.moderation_status) {
      throw new Error('Submission result is incomplete');
    }

    const isApproved = outcome.moderation_status === 'approved';
    return response(
      {
        wishId: outcome.wish_id,
        status: outcome.moderation_status,
        duplicate: outcome.was_duplicate,
        message: isApproved
          ? 'Lời chúc đã được hiển thị.'
          : 'Lời chúc đã được gửi và đang chờ duyệt.',
      },
      outcome.was_duplicate ? 200 : 201,
      context.requestId
    );
  } catch (error) {
    logger.error('submit-wish failed', error, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      surface: 'function',
      function: 'submit-wish',
      resultCode,
      durationMs: requestDurationMs(context),
    });
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'Unable to submit the wish right now.',
      500,
      context.requestId,
      { retryable: true }
    );
  } finally {
    logger.request('submit-wish completed', {
      requestId: context.requestId,
      correlationId: context.correlationId,
      surface: 'function',
      function: 'submit-wish',
      resultCode,
      durationMs: requestDurationMs(context),
    });
  }
});
