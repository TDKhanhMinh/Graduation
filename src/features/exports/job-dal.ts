import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

import { exportJobStateSchema, type ExportJobStatus } from './job-contract'

type ExportJobRow = {
  id: string
  event_id: string
  state: string
  attempt_count: number
  max_attempts: number
  lease_expires_at: string | null
  next_attempt_at: string
  artifact_size_bytes: number | null
  created_at: string
  updated_at: string
  completed_at: string | null
  last_error_code: string | null
}

function toExportJobStatus(row: ExportJobRow): ExportJobStatus {
  return {
    id: row.id,
    eventId: row.event_id,
    state: exportJobStateSchema.parse(row.state),
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    leaseExpiresAt: row.lease_expires_at,
    nextAttemptAt: row.next_attempt_at,
    artifactSizeBytes: row.artifact_size_bytes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    lastErrorCode: row.last_error_code,
  }
}

export async function getOwnerExportJob(jobId: string): Promise<ExportJobStatus | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('export_jobs')
    .select('id,event_id,state,attempt_count,max_attempts,lease_expires_at,next_attempt_at,artifact_size_bytes,created_at,updated_at,completed_at,last_error_code')
    .eq('id', jobId)
    .maybeSingle()

  if (error) throw new Error('EXPORT_JOB_STATUS_UNAVAILABLE')
  return data ? toExportJobStatus(data as ExportJobRow) : null
}

export async function cancelOwnerExportJob(jobId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('cancel_export_job', {
    p_job_id: jobId,
  })

  if (error) throw new Error('EXPORT_JOB_CANCEL_UNAVAILABLE')
  return data === true
}

export async function createOwnerExportJob(input: {
  jobId: string
  eventId: string
  ownerId: string
  idempotencyKey: string
  snapshot: Json
  snapshotHash: string
  printTokenHash: string
  printTokenExpiresAt: string
}): Promise<{ id: string; state: string; createdAt: string }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('create_export_job', {
    p_job_id: input.jobId,
    p_event_id: input.eventId,
    p_owner_id: input.ownerId,
    p_idempotency_key: input.idempotencyKey,
    p_snapshot: input.snapshot,
    p_snapshot_hash: input.snapshotHash,
    p_print_token_hash: input.printTokenHash,
    p_print_token_expires_at: input.printTokenExpiresAt,
  })

  if (error || !data?.[0]) throw new Error(error?.code === '42501' ? 'EXPORT_JOB_NOT_ALLOWED' : 'EXPORT_JOB_CREATE_UNAVAILABLE')

  return {
    id: data[0].id,
    state: data[0].state,
    createdAt: data[0].created_at,
  }
}

export async function getOwnerCompletedExportPath(jobId: string): Promise<{
  eventId: string
  artifactPath: string
} | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('export_jobs')
    .select('event_id,artifact_path,state')
    .eq('id', jobId)
    .eq('state', 'completed')
    .maybeSingle()

  if (error) throw new Error('EXPORT_JOB_DOWNLOAD_UNAVAILABLE')
  if (!data?.artifact_path) return null
  return { eventId: data.event_id, artifactPath: data.artifact_path }
}
