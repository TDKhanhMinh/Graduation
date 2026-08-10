import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'

import {
  createDirectorSnapshot,
  directorSpeedSchema,
  directorWishSchema,
} from '@/features/director/protocol'
import { createDirectorSessionToken, hashDirectorSessionToken } from '@/features/director/session-token'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  eventId: z.uuid(),
  queue: z.array(directorWishSchema).max(900),
  qrVisible: z.boolean(),
  speed: directorSpeedSchema,
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

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body', 400)
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return errorResponse('Invalid Director session request', 400)

  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  let token: string
  try {
    token = createDirectorSessionToken(sessionId, expiresAt)
  } catch {
    return errorResponse('Director session is not configured', 503)
  }

  const snapshot = createDirectorSnapshot({
    sessionId,
    eventId: parsed.data.eventId,
    queue: parsed.data.queue,
    qrVisible: parsed.data.qrVisible,
    speed: parsed.data.speed,
  })
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('create_director_session', {
    p_session_id: sessionId,
    p_event_id: parsed.data.eventId,
    p_owner_id: session.userId,
    p_display_token_hash: hashDirectorSessionToken(token),
    p_display_token_expires_at: expiresAt,
    p_snapshot: snapshot,
  })

  if (error || !data?.[0]) {
    return error?.code === '42501'
      ? errorResponse('Director session is not allowed', 403)
      : errorResponse('Director session is temporarily unavailable', 500)
  }

  return NextResponse.json({
    sessionId,
    displayUrl: `/director/${sessionId}?token=${encodeURIComponent(token)}`,
    version: data[0].version,
    snapshot: data[0].snapshot,
  }, { status: 201, headers: PRIVATE_HEADERS })
}
