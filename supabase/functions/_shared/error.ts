import { corsHeaders } from './cors.ts';

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export type ErrorResponseBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export const createError = (code: ErrorCode, message: string, details?: unknown): AppError => {
  const statusMap: Record<ErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    RATE_LIMITED: 429,
    VALIDATION_ERROR: 400,
  };

  return new AppError(code, message, statusMap[code], details);
};

export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  } else if (error instanceof Error) {
    return createError('INTERNAL_SERVER_ERROR', error.message);
  }

  return createError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
};

export const toErrorResponseBody = (
  error: unknown,
  requestId?: string
): ErrorResponseBody => {
  const appError = normalizeError(error);

  return {
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId,
    },
  };
};

export const handleApiError = (error: unknown, requestId?: string) => {
  const appError = normalizeError(error);

  return new Response(
    JSON.stringify(toErrorResponseBody(appError, requestId)),
    {
      status: appError.statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};
