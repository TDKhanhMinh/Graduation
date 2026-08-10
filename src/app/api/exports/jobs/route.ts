import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'

import { OwnerExportDataError, OwnerExportTooLargeError, getOwnerExportSnapshot } from '@/features/exports/dal'
import { createOwnerExportJob } from '@/features/exports/job-dal'
import { createExportJobRequestSchema } from '@/features/exports/job-contract'
import { createExportPrintToken, hashExportPrintToken, hashExportSnapshot } from '@/features/exports/print-token'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: PRIVATE_HEADERS })
}

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body', 400)
  }

  const parsed = createExportJobRequestSchema.safeParse({
    ...(typeof body === 'object' && body !== null ? body : {}),
    idempotencyKey: request.headers.get('Idempotency-Key') ?? (typeof body === 'object' && body !== null && 'idempotencyKey' in body ? body.idempotencyKey : undefined),
  })
  if (!parsed.success) return errorResponse('Invalid export job request', 400)

  try {
    const snapshot = await getOwnerExportSnapshot(parsed.data.eventId)
    if (!snapshot) return errorResponse('Export not found', 404)

    const jobId = randomUUID()
    const printTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const printToken = createExportPrintToken(jobId, printTokenExpiresAt)
    const job = await createOwnerExportJob({
      jobId,
      eventId: parsed.data.eventId,
      ownerId: session.userId,
      idempotencyKey: parsed.data.idempotencyKey ?? randomUUID(),
      snapshot,
      snapshotHash: hashExportSnapshot(snapshot),
      printTokenHash: hashExportPrintToken(printToken),
      printTokenExpiresAt,
    })

    return NextResponse.json(
      { jobId: job.id, state: job.state, createdAt: job.createdAt },
      { status: 202, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    if (error instanceof OwnerExportTooLargeError) return errorResponse('Export exceeds the current size limit', 413)
    if (error instanceof OwnerExportDataError) return errorResponse('Export is temporarily unavailable', 500)
    if (error instanceof z.ZodError) return errorResponse('Invalid export snapshot', 422)
    if (error instanceof Error && error.message === 'EXPORT_JOB_NOT_ALLOWED') return errorResponse('Export not found', 404)
    if (error instanceof Error && error.message === 'EXPORT_PRINT_TOKEN_SECRET is not configured') return errorResponse('Export is not configured', 503)

    console.error('Export job creation failed', error instanceof Error ? { name: error.name } : undefined)
    return errorResponse('Export is temporarily unavailable', 500)
  }
}
