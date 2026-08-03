export const getClientIp = (req: Request) => {
  const forwarded = req.headers.get('x-forwarded-for');
  const connectingIp = req.headers.get('cf-connecting-ip');

  return forwarded?.split(',')[0]?.trim() || connectingIp?.trim() || 'unknown';
};

export const hashIdentifier = async (value: string, salt: string) => {
  if (!salt) {
    throw new Error('WISH_RATE_LIMIT_SALT is required');
  }

  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
