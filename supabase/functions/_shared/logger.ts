import { AppError } from './error.ts';

type JsonPrimitive = string | number | boolean | null;
export type LogValue = JsonPrimitive | LogValue[] | { [key: string]: LogValue | undefined };
export type LogFields = Record<string, LogValue | undefined>;

const REDACTED_KEYS = [
  'captcha',
  'token',
  'ip',
  'prompt',
  'ai_prompt',
  'signed_url',
  'password',
  'secret',
  'media',
];

export const redactLogFields = (obj: LogValue | undefined): LogValue | undefined => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .map((item) => redactLogFields(item))
      .filter((item): item is LogValue => item !== undefined);
  }

  const redacted: LogFields = {};
  for (const key of Object.keys(obj)) {
    if (REDACTED_KEYS.some((rk) => key.toLowerCase().includes(rk))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactLogFields(obj[key]);
    }
  }
  return redacted;
};

type LogLevel = 'info' | 'warn' | 'error';
type RequestSurface = 'action' | 'route' | 'function' | 'worker';
type ResultCode = string | number;

export interface LogContext extends LogFields {
  requestId?: string;
  correlationId?: string;
  surface?: RequestSurface;
  function?: string;
  route?: string;
  action?: string;
  worker?: string;
  resultCode?: ResultCode;
  durationMs?: number;
}

export type RequestContext = {
  requestId: string;
  correlationId: string;
  startedAt: number;
};

export type RequestLogContext = LogContext & {
  surface: RequestSurface;
  resultCode: ResultCode;
  durationMs: number;
  requestId: string;
  correlationId: string;
};

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const timestamp = new Date().toISOString();
  const safeContext = context ? (redactLogFields(context) as LogFields) : undefined;

  const logEntry = {
    timestamp,
    level,
    message,
    ...safeContext,
  };

  const str = JSON.stringify(logEntry);
  if (level === 'error') {
    console.error(str);
  } else if (level === 'warn') {
    console.warn(str);
  } else {
    console.info(str);
  }
};

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  request: (message: string, context: RequestLogContext) => log('info', message, context),
  error: (message: string, error?: unknown, context?: LogContext) => {
    let errContext: LogFields;

    if (error instanceof AppError) {
      errContext = {
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details as LogValue,
        resultCode: context?.resultCode ?? error.code,
      };
    } else if (error instanceof Error) {
      errContext = {
        errorMessage: error.message,
        errorStack: error.stack,
        resultCode: context?.resultCode ?? 'INTERNAL_SERVER_ERROR',
      };
    } else {
      errContext = {
        errorRaw: String(error),
        resultCode: context?.resultCode ?? 'INTERNAL_SERVER_ERROR',
      };
    }

    log('error', message, { ...context, ...errContext });
  },
};

export const createRequestContext = (req: Request, now = Date.now()): RequestContext => {
  const inboundRequestId = req.headers.get('x-request-id')?.trim();
  const inboundCorrelationId = req.headers.get('x-correlation-id')?.trim();
  const requestId = inboundRequestId || crypto.randomUUID();

  return {
    requestId,
    correlationId: inboundCorrelationId || requestId,
    startedAt: now,
  };
};

export const requestDurationMs = (
  context: Pick<RequestContext, 'startedAt'>,
  now = Date.now()
) => Math.max(0, now - context.startedAt);

export const getOrGenerateReqId = (req: Request) => createRequestContext(req).requestId;
