import { z } from 'zod'
import { NextResponse } from 'next/server'

import {
  getOwnerExportSnapshot,
  OwnerExportDataError,
  OwnerExportTooLargeError,
} from '@/features/exports/dal'
import {
  createOwnerExportFileName,
  serializeOwnerExportCsv,
  serializeOwnerExportJson,
} from '@/features/exports/contract'

export const dynamic = 'force-dynamic'

const routeParamsSchema = z.object({
  eventId: z.uuid(),
  format: z.enum(['csv', 'json']),
})

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
  { params }: { params: Promise<{ eventId: string; format: string }> },
) {
  const parsedParams = routeParamsSchema.safeParse(await params)
  if (!parsedParams.success) return errorResponse('Invalid export route', 400)

  try {
    const snapshot = await getOwnerExportSnapshot(parsedParams.data.eventId)
    if (!snapshot) return errorResponse('Export not found', 404)

    const isCsv = parsedParams.data.format === 'csv'
    const body = isCsv
      ? serializeOwnerExportCsv(snapshot)
      : serializeOwnerExportJson(snapshot)
    const format = parsedParams.data.format
    const contentType = isCsv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8'
    const filename = createOwnerExportFileName(snapshot.event.slug, format)

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': contentType,
      },
    })
  } catch (error) {
    if (error instanceof OwnerExportTooLargeError) {
      return errorResponse('Export exceeds the current size limit', 413)
    }
    if (error instanceof OwnerExportDataError) {
      return errorResponse('Export is temporarily unavailable', 500)
    }

    console.error('Owner export route failed', error)
    return errorResponse('Export is temporarily unavailable', 500)
  }
}
