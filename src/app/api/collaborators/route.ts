import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createInvitationToken } from '@/features/collaboration/token'
import { verifySession } from '@/lib/auth/dal'
import { getOwnedEventById } from '@/features/events/dal'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
}

const createInvitationSchema = z.object({
  eventId: z.uuid(),
  email: z.string().trim().email().max(320),
  role: z.enum(['editor', 'moderator', 'viewer']),
})

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS })
}

export async function GET(request: Request) {
  const session = await verifySession()
  if (!session) return response({ error: 'Unauthorized' }, 401)

  const eventId = new URL(request.url).searchParams.get('eventId')
  if (!eventId || !z.uuid().safeParse(eventId).success) return response({ error: 'Invalid event' }, 400)
  const event = await getOwnedEventById(eventId)
  if (!event) return response({ error: 'Event not found' }, 404)

  const supabase = createAdminClient()
  const [collaborators, invitations] = await Promise.all([
    supabase
      .from('event_collaborators')
      .select('event_id,user_id,role,invited_by,created_at,updated_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true }),
    supabase
      .from('event_invitations')
      .select('id,event_id,email,role,token_expires_at,accepted_at,revoked_at,created_at')
      .eq('event_id', eventId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }),
  ])

  if (collaborators.error || invitations.error) return response({ error: 'Collaborators are temporarily unavailable' }, 500)
  return response({ collaborators: collaborators.data, invitations: invitations.data })
}

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session) return response({ error: 'Unauthorized' }, 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return response({ error: 'Invalid request body' }, 400)
  }

  const parsed = createInvitationSchema.safeParse(body)
  if (!parsed.success) return response({ error: 'Invalid invitation request' }, 400)
  const event = await getOwnedEventById(parsed.data.eventId)
  if (!event) return response({ error: 'Event not found' }, 404)

  const invitationId = randomUUID()
  const { token, tokenHash } = createInvitationToken()
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('create_event_invitation', {
    p_invitation_id: invitationId,
    p_event_id: parsed.data.eventId,
    p_owner_id: session.userId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_token_hash: tokenHash,
    p_token_expires_at: tokenExpiresAt,
  })

  if (error || !data?.[0]) {
    if (error?.code === '23505') return response({ error: 'An active invitation already exists for this email' }, 409)
    return response({ error: 'Invitation could not be created' }, 500)
  }

  return response({
    invitation: data[0],
    inviteUrl: `/auth/invitations/${invitationId}?token=${encodeURIComponent(token)}`,
  }, 201)
}
