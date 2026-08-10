import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getDirectorDisplaySession } from '@/features/director/dal'

export const dynamic = 'force-dynamic'

const sessionIdSchema = z.uuid()
const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const sessionId = sessionIdSchema.safeParse((await params).sessionId)
  const token = new URL(request.url).searchParams.get('token')
  if (!sessionId.success || !token || token.length > 512) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PRIVATE_HEADERS })
  }

  const session = await getDirectorDisplaySession(sessionId.data, token)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PRIVATE_HEADERS })

  return NextResponse.json({
    eventId: session.eventId,
    version: session.version,
    snapshot: session.snapshot,
    updatedAt: session.updatedAt,
  }, { headers: PRIVATE_HEADERS })
}
