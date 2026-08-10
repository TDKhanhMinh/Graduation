import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import {
  directorCommandSchema,
  directorSnapshotSchema,
  reduceDirectorCommand,
} from '@/features/director/protocol'

export const dynamic = 'force-dynamic'

const sessionIdSchema = z.uuid()
const requestSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  command: directorCommandSchema,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await verifySession()
  if (!session) return errorResponse('Unauthorized', 401)

  const sessionId = sessionIdSchema.safeParse((await params).sessionId)
  if (!sessionId.success) return errorResponse('Invalid Director session', 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body', 400)
  }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success || parsed.data.command.sessionId !== sessionId.data) {
    return errorResponse('Invalid Director command', 400)
  }

  const supabase = await createClient()
  const { data: current, error: currentError } = await supabase
    .from('director_sessions')
    .select('event_id,version,snapshot,status')
    .eq('id', sessionId.data)
    .eq('owner_id', session.userId)
    .maybeSingle()

  if (currentError || !current || current.status !== 'active') return errorResponse('Director session not found', 404)

  const snapshot = directorSnapshotSchema.parse(current.snapshot)
  const nextSnapshot = reduceDirectorCommand(snapshot, parsed.data.command)
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('apply_director_snapshot', {
    p_session_id: sessionId.data,
    p_owner_id: session.userId,
    p_expected_version: parsed.data.expectedVersion,
    p_sequence: parsed.data.command.sequence,
    p_snapshot: nextSnapshot,
  })

  if (error || !data?.[0]) return errorResponse('Director session update unavailable', 500)
  const result = data[0]
  if (!result.applied) {
    return NextResponse.json({ applied: false, version: result.version, snapshot: result.snapshot }, {
      status: 409,
      headers: PRIVATE_HEADERS,
    })
  }

  return NextResponse.json({ applied: true, version: result.version, snapshot: result.snapshot }, {
    headers: PRIVATE_HEADERS,
  })
}
