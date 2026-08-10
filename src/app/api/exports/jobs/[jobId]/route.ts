import { NextResponse } from 'next/server'

import { verifySession } from '@/lib/auth/dal'

import { exportJobIdSchema } from '@/features/exports/job-contract'
import { cancelOwnerExportJob, getOwnerExportJob } from '@/features/exports/job-dal'

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

async function readJobId(params: Promise<{ jobId: string }>) {
  const parsed = exportJobIdSchema.safeParse((await params).jobId)
  return parsed.success ? parsed.data : null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  const jobId = await readJobId(params)
  if (!jobId) return errorResponse('Invalid export job', 400)

  try {
    const job = await getOwnerExportJob(jobId)
    return job
      ? NextResponse.json(job, { headers: PRIVATE_HEADERS })
      : errorResponse('Export job not found', 404)
  } catch {
    return errorResponse('Export job is temporarily unavailable', 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  const jobId = await readJobId(params)
  if (!jobId) return errorResponse('Invalid export job', 400)

  try {
    const cancelled = await cancelOwnerExportJob(jobId)
    return cancelled
      ? NextResponse.json({ jobId, state: 'cancelled' }, { headers: PRIVATE_HEADERS })
      : errorResponse('Export job cannot be cancelled', 409)
  } catch {
    return errorResponse('Export job is temporarily unavailable', 500)
  }
}
