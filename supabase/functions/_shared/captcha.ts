export type CaptchaVerification = {
  success: boolean;
  errorCodes: string[];
};

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
};

type VerifyCaptchaOptions = {
  token: string;
  remoteIp: string;
  idempotencyKey: string;
  secret: string;
  expectedHostname?: string;
  bypassToken?: string;
  fetcher?: typeof fetch;
};

export const verifyCaptcha = async ({
  token,
  remoteIp,
  idempotencyKey,
  secret,
  expectedHostname,
  bypassToken,
  fetcher = fetch,
}: VerifyCaptchaOptions): Promise<CaptchaVerification> => {
  if (bypassToken && token === bypassToken) {
    return { success: true, errorCodes: [] };
  }

  if (!secret) {
    return { success: false, errorCodes: ['missing-secret'] };
  }

  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', remoteIp);
  formData.append('idempotency_key', idempotencyKey);

  let response: Response;
  try {
    response = await fetcher(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(5000),
      }
    );
  } catch {
    return { success: false, errorCodes: ['verification-unavailable'] };
  }

  if (!response.ok) {
    return { success: false, errorCodes: ['verification-unavailable'] };
  }

  const outcome = (await response.json()) as TurnstileResponse;
  const hostnameMatches =
    !expectedHostname || outcome.hostname === expectedHostname;
  const actionMatches = !outcome.action || outcome.action === 'submit_wish';

  return {
    success: outcome.success === true && hostnameMatches && actionMatches,
    errorCodes: outcome['error-codes'] ?? [],
  };
};
