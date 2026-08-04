const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>{}[\]]+/gi;
const MEDIA_PATH_PATTERN =
  /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/(?:avatar_)?[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp|heic|mp3|mp4|m4a|webm|aac|wav|ogg)$/i;
const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);
const AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/aac',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
]);

const SERVER_OWNED_FIELDS = new Set([
  'status',
  'moderationStatus',
  'moderation_status',
  'isPinned',
  'is_pinned',
  'pinned',
  'approvedAt',
  'approved_at',
  'moderationReason',
  'moderation_reason',
]);

const ALLOWED_FIELDS = new Set([
  'eventId',
  'clientRequestId',
  'senderName',
  'content',
  'captchaToken',
  'deviceKey',
  'media',
  'senderAvatarPath',
]);

export type SubmitWishRequest = {
  eventId: string;
  clientRequestId: string;
  senderName: string;
  content: string;
  captchaToken: string;
  deviceKey: string;
  media?: {
    path: string;
    type: 'image' | 'audio';
    mimeType: string;
    sizeBytes: number;
    durationMs?: number;
    width?: number;
    height?: number;
  };
  senderAvatarPath?: string;
};

export type SubmissionValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type SubmissionParseResult =
  | { success: true; data: SubmitWishRequest }
  | { success: false; issues: SubmissionValidationIssue[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizedString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const addIssue = (
  issues: SubmissionValidationIssue[],
  field: string,
  code: string,
  message: string
) => {
  issues.push({ field, code, message });
};

export const countUrls = (content: string) => content.match(URL_PATTERN)?.length ?? 0;

export const parseSubmitWishRequest = (input: unknown): SubmissionParseResult => {
  if (!isRecord(input)) {
    return {
      success: false,
      issues: [{ field: 'body', code: 'INVALID_TYPE', message: 'Body must be an object.' }],
    };
  }

  const issues: SubmissionValidationIssue[] = [];
  const keys = Object.keys(input);
  const serverOwned = keys.filter((key) => SERVER_OWNED_FIELDS.has(key));
  const unknown = keys.filter((key) => !ALLOWED_FIELDS.has(key) && !SERVER_OWNED_FIELDS.has(key));

  if (serverOwned.length > 0) {
    addIssue(
      issues,
      'body',
      'SERVER_OWNED_FIELD',
      'Moderation fields cannot be provided by the client.'
    );
  }

  if (unknown.length > 0) {
    addIssue(issues, 'body', 'UNKNOWN_FIELD', 'Request contains unsupported fields.');
  }

  const eventId = normalizedString(input.eventId);
  const clientRequestId = normalizedString(input.clientRequestId);
  const senderName = normalizedString(input.senderName).replace(/\s+/g, ' ');
  const content = normalizedString(input.content).replace(/\r\n/g, '\n');
  const captchaToken = normalizedString(input.captchaToken);
  const deviceKey = normalizedString(input.deviceKey);

  if (!UUID_PATTERN.test(eventId)) {
    addIssue(issues, 'eventId', 'INVALID_UUID', 'Event identifier is invalid.');
  }
  if (!UUID_PATTERN.test(clientRequestId)) {
    addIssue(issues, 'clientRequestId', 'INVALID_UUID', 'Request identifier is invalid.');
  }
  if (senderName.length < 1 || senderName.length > 100) {
    addIssue(issues, 'senderName', 'INVALID_LENGTH', 'Sender name must be 1 to 100 characters.');
  }
  if (content.length < 1 || content.length > 5000) {
    addIssue(issues, 'content', 'INVALID_LENGTH', 'Content must be 1 to 5000 characters.');
  }
  if (countUrls(content) > 2) {
    addIssue(issues, 'content', 'TOO_MANY_URLS', 'Content contains too many links.');
  }
  if (captchaToken.length < 1 || captchaToken.length > 2048) {
    addIssue(issues, 'captchaToken', 'INVALID_LENGTH', 'CAPTCHA token is invalid.');
  }
  if (deviceKey.length < 16 || deviceKey.length > 256) {
    addIssue(issues, 'deviceKey', 'INVALID_LENGTH', 'Device key is invalid.');
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  let mediaParsed: SubmitWishRequest['media'];
  if (input.media !== undefined) {
    if (!isRecord(input.media)) {
      addIssue(issues, 'media', 'INVALID_MEDIA', 'Media object is missing required fields.');
    } else {
      const m = input.media;
      const mediaType = m.type === 'image' || m.type === 'audio' ? m.type : null;
      const mimeType = typeof m.mimeType === 'string' ? m.mimeType.toLowerCase() : '';
      const sizeBytes = typeof m.sizeBytes === 'number' ? m.sizeBytes : 0;
      const allowedMime = mediaType === 'image'
        ? IMAGE_MIME_TYPES.has(mimeType)
        : mediaType === 'audio'
          ? AUDIO_MIME_TYPES.has(mimeType)
          : false;
      const maxBytes = mediaType === 'image' ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
      const durationMs = typeof m.durationMs === 'number' ? m.durationMs : undefined;
      const dimensionsValid =
        (m.width === undefined || (typeof m.width === 'number' && Number.isInteger(m.width) && m.width > 0 && m.width <= 10000)) &&
        (m.height === undefined || (typeof m.height === 'number' && Number.isInteger(m.height) && m.height > 0 && m.height <= 10000));

      if (
        typeof m.path !== 'string' ||
        !MEDIA_PATH_PATTERN.test(m.path) ||
        !mediaType ||
        !allowedMime ||
        !Number.isInteger(sizeBytes) ||
        sizeBytes <= 0 ||
        sizeBytes > maxBytes ||
        (mediaType === 'audio' && (durationMs === undefined || !Number.isInteger(durationMs) || durationMs < 1 || durationMs > 90000)) ||
        (mediaType === 'image' && durationMs !== undefined) ||
        !dimensionsValid
      ) {
        addIssue(issues, 'media', 'INVALID_MEDIA', 'Media metadata or path is invalid.');
      } else {
        mediaParsed = {
          path: m.path,
          type: mediaType,
          mimeType,
          sizeBytes,
          durationMs,
          width: typeof m.width === 'number' ? m.width : undefined,
          height: typeof m.height === 'number' ? m.height : undefined,
        };
      }
    }
  }

  const senderAvatarPath = input.senderAvatarPath === undefined
    ? undefined
    : normalizedString(input.senderAvatarPath);
  if (senderAvatarPath !== undefined && !MEDIA_PATH_PATTERN.test(senderAvatarPath)) {
    addIssue(issues, 'senderAvatarPath', 'INVALID_MEDIA', 'Avatar path is invalid.');
  }

  if (mediaParsed?.path === senderAvatarPath) {
    addIssue(issues, 'media', 'INVALID_MEDIA', 'Media and avatar must use separate upload sessions.');
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      eventId,
      clientRequestId,
      senderName,
      content,
      captchaToken,
      deviceKey,
      media: mediaParsed,
      senderAvatarPath,
    },
  };
};

export const submitWishRequestSchema = {
  safeParse: parseSubmitWishRequest,
};
