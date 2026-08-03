// Basic in-memory rate limiting.
// In a real application with multiple instances, you should use Redis (e.g. Upstash) or database.

type RateLimitRecord = {
  count: number
  expiresAt: number
}

const store = new Map<string, RateLimitRecord>()

export async function rateLimit(
  ip: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const key = `${action}:${ip}`
  const now = Date.now()
  
  // Cleanup expired entries occasionally
  if (Math.random() < 0.1) {
    for (const [k, v] of store.entries()) {
      if (now > v.expiresAt) {
        store.delete(k)
      }
    }
  }

  let record = store.get(key)

  if (!record || now > record.expiresAt) {
    record = {
      count: 0,
      expiresAt: now + windowSeconds * 1000,
    }
  }

  record.count++
  store.set(key, record)

  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.expiresAt,
  }
}
