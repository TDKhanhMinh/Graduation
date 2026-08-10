import { createHash, createHmac } from 'node:crypto'

const VERSION = 'v1'

function secret(): string {
  const value = process.env.EXPORT_PRINT_TOKEN_SECRET
  if (!value || value.length < 32) throw new Error('EXPORT_PRINT_TOKEN_SECRET is required')
  return value
}

export function createExportPrintToken(jobId: string, expiresAt: string): string {
  const expiresAtMs = Date.parse(expiresAt)
  const payload = `${VERSION}:${jobId}:${expiresAtMs}`
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${VERSION}.${jobId}.${expiresAtMs}.${signature}`
}

export function hashExportPrintToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
