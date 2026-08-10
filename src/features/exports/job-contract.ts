import { z } from 'zod'

export const exportJobStateSchema = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
])

export type ExportJobState = z.infer<typeof exportJobStateSchema>

export const createExportJobRequestSchema = z.object({
  eventId: z.uuid(),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
})

export const exportJobIdSchema = z.uuid()

export type ExportJobStatus = {
  id: string
  eventId: string
  state: ExportJobState
  attemptCount: number
  maxAttempts: number
  leaseExpiresAt: string | null
  nextAttemptAt: string
  artifactSizeBytes: number | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  lastErrorCode: string | null
}
