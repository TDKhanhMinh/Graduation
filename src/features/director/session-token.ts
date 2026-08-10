import { createHash, createHmac } from 'node:crypto'

const VERSION = 'v1'

function secret(): string {
  const value = process.env.DIRECTOR_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('DIRECTOR_SESSION_SECRET is required')
  return value
}

export function createDirectorSessionToken(sessionId: string, expiresAt: string): string {
  const expiresAtMs = Date.parse(expiresAt)
  const payload = `${VERSION}:${sessionId}:${expiresAtMs}`
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${VERSION}.${sessionId}.${expiresAtMs}.${signature}`
}

export function hashDirectorSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
