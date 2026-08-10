import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'
import { getOwnedEventById } from '@/features/events/dal'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({ eventId: z.uuid() })

export async function POST(request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  const session = await verifySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { inviteId } = await params
  if (!z.uuid().safeParse(inviteId).success) return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success || !(await getOwnedEventById(parsed.data.eventId))) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data, error } = await createAdminClient().rpc('revoke_event_invitation', {
    p_invitation_id: inviteId,
    p_owner_id: session.userId,
  })
  if (error) return NextResponse.json({ error: 'Invitation could not be revoked' }, { status: 500 })
  return NextResponse.json({ revoked: data === true }, { headers: { 'Cache-Control': 'private, no-store' } })
}
