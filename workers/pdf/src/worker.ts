import { createHash } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
// The worker owns this dependency in workers/pdf/package.json; the root app does not.
// @ts-expect-error The root app does not install the isolated worker dependency.
import puppeteer from 'puppeteer'

import { workerConfig } from './config.js'
import { createExportPrintToken, hashExportPrintToken } from './print-token.js'

type ClaimedJob = {
  id: string
  event_id: string
  owner_id: string
  snapshot: Record<string, unknown>
  attempt_count: number
  max_attempts: number
  lease_expires_at: string
  print_token_expires_at: string
  created_at: string
}

type CleanupCandidate = {
  job_id: string
  artifact_path: string
}

function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...fields }))
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class PdfExportWorker {
  private readonly supabase: SupabaseClient
  private stopping = false
  private cleanupTimer: NodeJS.Timeout | undefined

  constructor() {
    this.supabase = createClient(workerConfig.supabaseUrl, workerConfig.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  stop() {
    this.stopping = true
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }

  async start() {
    log('pdf_worker_started', { worker_id: workerConfig.workerId })
    await this.cleanup()
    this.cleanupTimer = setInterval(() => {
      void this.cleanup()
    }, workerConfig.cleanupIntervalMs)

    while (!this.stopping) {
      const job = await this.claim()
      if (job) {
        await this.process(job)
      } else {
        await sleep(workerConfig.pollIntervalMs)
      }
    }
    log('pdf_worker_stopped', { worker_id: workerConfig.workerId })
  }

  private async cleanup() {
    const { data, error } = await this.supabase.rpc('get_export_artifacts_to_cleanup', {
      p_retention_hours: workerConfig.retentionHours,
      p_limit: workerConfig.cleanupBatchSize,
    })
    if (error) {
      log('pdf_export_cleanup_error', { phase: 'list', error_code: error.code ?? 'UNKNOWN' })
      return
    }

    for (const candidate of (data as CleanupCandidate[] | null) ?? []) {
      const { error: removeError } = await this.supabase.storage
        .from('yearbook-exports')
        .remove([candidate.artifact_path])

      if (removeError) {
        log('pdf_export_cleanup_error', {
          phase: 'storage_remove',
          job_id: candidate.job_id,
          error_code: removeError.name ?? 'STORAGE_REMOVE_FAILED',
        })
        continue
      }

      const { data: finalized, error: finalizeError } = await this.supabase.rpc(
        'finalize_export_artifact_cleanup',
        {
          p_job_id: candidate.job_id,
          p_artifact_path: candidate.artifact_path,
          p_retention_hours: workerConfig.retentionHours,
        },
      )
      if (finalizeError || finalized !== true) {
        log('pdf_export_cleanup_error', {
          phase: 'metadata_finalize',
          job_id: candidate.job_id,
          error_code: finalizeError?.code ?? 'METADATA_FINALIZE_FAILED',
        })
        continue
      }

      log('pdf_export_cleanup_completed', {
        job_id: candidate.job_id,
        artifact_path: candidate.artifact_path,
      })
    }
  }

  private async claim(): Promise<ClaimedJob | null> {
    const { data, error } = await this.supabase.rpc('claim_export_job', {
      p_worker_id: workerConfig.workerId,
      p_lease_seconds: workerConfig.leaseSeconds,
    })

    if (error) {
      log('pdf_worker_claim_error', { worker_id: workerConfig.workerId, error_code: error.code ?? 'UNKNOWN' })
      return null
    }

    return (data?.[0] as ClaimedJob | undefined) ?? null
  }

  private async process(job: ClaimedJob) {
    const startedAt = Date.now()
    let heartbeat: NodeJS.Timeout | undefined
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined

    try {
      const printTokenExpiresAt = new Date(Date.now() + workerConfig.printTokenTtlMs).toISOString()
      const printToken = createExportPrintToken(job.id, printTokenExpiresAt)
      const { data: prepared, error: prepareError } = await this.supabase.rpc('prepare_export_print_token', {
        p_job_id: job.id,
        p_worker_id: workerConfig.workerId,
        p_print_token_hash: hashExportPrintToken(printToken),
        p_print_token_expires_at: printTokenExpiresAt,
      })
      if (prepareError || prepared !== true) throw new Error('PRINT_TOKEN_PREPARE_FAILED')

      heartbeat = setInterval(() => {
        void this.supabase.rpc('heartbeat_export_job', {
          p_job_id: job.id,
          p_worker_id: workerConfig.workerId,
          p_lease_seconds: workerConfig.leaseSeconds,
        }).then(({ error }) => {
          if (error) log('pdf_worker_heartbeat_error', { job_id: job.id, error_code: error.code ?? 'UNKNOWN' })
        })
      }, Math.max(5000, workerConfig.leaseSeconds * 500))

      browser = await puppeteer.launch({
        headless: true,
        args: workerConfig.chromiumArgs,
      })
      const page = await browser.newPage()
      page.setDefaultNavigationTimeout(workerConfig.navigationTimeoutMs)
      await page.goto(`${workerConfig.appUrl}/api/exports/print/${job.id}?token=${encodeURIComponent(printToken)}`, {
        waitUntil: 'networkidle2',
      })
      await page.evaluate(() => document.fonts?.ready)
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
      })

      const artifactPath = `${job.owner_id}/${job.id}/attempt-${job.attempt_count}.pdf`
      const artifactSha256 = createHash('sha256').update(pdf).digest('hex')
      const { error: uploadError } = await this.supabase.storage
        .from('yearbook-exports')
        .upload(artifactPath, pdf, {
          contentType: 'application/pdf',
          upsert: false,
        })
      if (uploadError && uploadError.message !== 'The resource already exists') throw new Error('PDF_UPLOAD_FAILED')

      const { data: completed, error: completeError } = await this.supabase.rpc('complete_export_job', {
        p_job_id: job.id,
        p_worker_id: workerConfig.workerId,
        p_artifact_path: artifactPath,
        p_artifact_size_bytes: pdf.byteLength,
        p_artifact_sha256: artifactSha256,
      })
      if (completeError || completed !== true) throw new Error('EXPORT_COMPLETE_FAILED')

      log('pdf_export_completed', {
        job_id: job.id,
        attempt: job.attempt_count,
        queue_wait_ms: Math.max(0, startedAt - Date.parse(job.created_at)),
        render_duration_ms: Date.now() - startedAt,
        file_size_bytes: pdf.byteLength,
      })
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'PDF_WORKER_ERROR'
      await this.supabase.rpc('fail_export_job', {
        p_job_id: job.id,
        p_worker_id: workerConfig.workerId,
        p_error_code: errorCode.slice(0, 100),
        p_error_message: errorName(error),
        p_retry_after_seconds: Math.min(3600, 30 * 2 ** Math.max(0, job.attempt_count - 1)),
      })
      log('pdf_export_failed', { job_id: job.id, attempt: job.attempt_count, error_code: errorCode.slice(0, 100) })
    } finally {
      if (heartbeat) clearInterval(heartbeat)
      if (browser) await browser.close().catch(() => undefined)
    }
  }
}
