const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>{}[\]]+/gi;

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
]);

export type SubmitWishRequest = {
  eventId: string;
  clientRequestId: string;
  senderName: string;
  content: string;
  captchaToken: string;
  deviceKey: string;
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

  return {
    success: true,
    data: {
      eventId,
      clientRequestId,
      senderName,
      content,
      captchaToken,
      deviceKey,
    },
  };
};

export const submitWishRequestSchema = {
  safeParse: parseSubmitWishRequest,
};
