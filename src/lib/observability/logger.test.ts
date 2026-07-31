import { describe, it, expect } from 'vitest';
import { createError } from './error';
import {
  createRequestContext,
  logger,
  redactLogFields,
  requestDurationMs,
} from './logger';

describe('Logger Redaction', () => {
  it('should redact sensitive keys at root level', () => {
    const input = {
      name: 'John Doe',
      captcha: '12345',
      ip: '192.168.1.1',
      token: 'secret-token',
    };

    const output = redactLogFields(input);

    expect(output).toMatchObject({
      name: 'John Doe',
      captcha: '[REDACTED]',
      ip: '[REDACTED]',
      token: '[REDACTED]',
    });
  });

  it('should redact sensitive keys in nested objects', () => {
    const input = {
      user: {
        id: 1,
        password: 'my-password',
        profile: {
          secret_code: '123',
        },
      },
    };

    const output = redactLogFields(input);

    expect(output).toMatchObject({
      user: {
        id: 1,
        password: '[REDACTED]',
        profile: {
          secret_code: '[REDACTED]',
        },
      },
    });
  });

  it('should redact sensitive keys in arrays of objects', () => {
    const input = {
      requests: [
        { id: 1, ai_prompt: 'hello' },
        { id: 2, prompt: 'world' },
      ],
    };

    const output = redactLogFields(input);

    expect(output).toMatchObject({
      requests: [
        { id: 1, ai_prompt: '[REDACTED]' },
        { id: 2, prompt: '[REDACTED]' },
      ],
    });
  });

  it('should handle null, undefined, and non-objects gracefully', () => {
    expect(redactLogFields(null)).toBeNull();
    expect(redactLogFields(undefined)).toBeUndefined();
    expect(redactLogFields('string')).toBe('string');
    expect(redactLogFields(123)).toBe(123);
  });

  it('should carry inbound request and correlation IDs', () => {
    const headers = new Headers({
      'x-request-id': 'req-123',
      'x-correlation-id': 'corr-456',
    });

    expect(createRequestContext(headers, 1000)).toEqual({
      requestId: 'req-123',
      correlationId: 'corr-456',
      startedAt: 1000,
    });
    expect(requestDurationMs({ startedAt: 1000 }, 1250)).toBe(250);
  });

  it('should emit minimum request log contract', () => {
    const calls: string[] = [];
    const originalInfo = console.info;
    console.info = (message?: unknown) => {
      calls.push(String(message));
    };

    try {
      logger.request('handled request', {
        surface: 'route',
        route: '/api/health',
        resultCode: 200,
        durationMs: 12,
        requestId: 'req-1',
        correlationId: 'corr-1',
      });
    } finally {
      console.info = originalInfo;
    }

    const entry = JSON.parse(calls[0]);
    expect(entry).toMatchObject({
      level: 'info',
      message: 'handled request',
      surface: 'route',
      route: '/api/health',
      resultCode: 200,
      durationMs: 12,
      requestId: 'req-1',
      correlationId: 'corr-1',
    });
  });

  it('should normalize AppError fields and redact error details', () => {
    const calls: string[] = [];
    const originalError = console.error;
    console.error = (message?: unknown) => {
      calls.push(String(message));
    };

    try {
      logger.error(
        'failed request',
        createError('FORBIDDEN', 'Denied', {
          signed_url: 'https://example.test/media?token=secret',
        }),
        {
          surface: 'action',
          action: 'createEvent',
          durationMs: 5,
          requestId: 'req-2',
          correlationId: 'req-2',
        }
      );
    } finally {
      console.error = originalError;
    }

    const entry = JSON.parse(calls[0]);
    expect(entry).toMatchObject({
      level: 'error',
      errorCode: 'FORBIDDEN',
      resultCode: 'FORBIDDEN',
      requestId: 'req-2',
      correlationId: 'req-2',
      errorDetails: {
        signed_url: '[REDACTED]',
      },
    });
  });
});
