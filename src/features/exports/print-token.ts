import { createHash, createHmac } from 'node:crypto'

const PRINT_TOKEN_VERSION = 'v1'

export function getExportPrintTokenSecret(): string {
  const secret = process.env.EXPORT_PRINT_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('EXPORT_PRINT_TOKEN_SECRET is not configured')
  }
  return secret
}

export function createExportPrintToken(jobId: string, expiresAt: string): string {
  const expiresAtMs = Date.parse(expiresAt)
  if (!Number.isFinite(expiresAtMs)) throw new Error('Invalid print token expiry')

  const payload = `${PRINT_TOKEN_VERSION}:${jobId}:${expiresAtMs}`
  const signature = createHmac('sha256', getExportPrintTokenSecret())
    .update(payload)
    .digest('base64url')

  return `${PRINT_TOKEN_VERSION}.${jobId}.${expiresAtMs}.${signature}`
}

export function hashExportPrintToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function hashExportSnapshot(snapshot: unknown): string {
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
}
