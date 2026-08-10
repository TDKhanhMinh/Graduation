import { NextResponse } from 'next/server'

import { verifySession } from '@/lib/auth/dal'

import { exportJobIdSchema } from '@/features/exports/job-contract'
import { getOwnerCompletedExportPath } from '@/features/exports/job-dal'
import { createClient } from '@/lib/supabase/server'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  const jobId = exportJobIdSchema.safeParse((await params).jobId)
  if (!jobId.success) return errorResponse('Invalid export job', 400)

  try {
    const job = await getOwnerCompletedExportPath(jobId.data)
    if (!job) return errorResponse('Export artifact is not ready', 409)

    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('yearbook-exports')
      .createSignedUrl(job.artifactPath, 10 * 60, { download: true })

    if (error || !data?.signedUrl) return errorResponse('Export download is temporarily unavailable', 500)

    return NextResponse.json(
      { jobId: jobId.data, downloadUrl: data.signedUrl, expiresIn: 600 },
      { headers: PRIVATE_HEADERS },
    )
  } catch {
    return errorResponse('Export download is temporarily unavailable', 500)
  }
}
