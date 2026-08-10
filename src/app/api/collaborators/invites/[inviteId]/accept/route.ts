import { NextResponse } from 'next/server'
import { z } from 'zod'

import { hashInvitationToken } from '@/features/collaboration/token'
import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({ token: z.string().min(20).max(200) })

export async function POST(request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  const session = await verifySession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { inviteId } = await params
  if (!z.uuid().safeParse(inviteId).success) return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 })

  const { data, error } = await createAdminClient().rpc('accept_event_invitation', {
    p_invitation_id: inviteId,
    p_user_id: session.userId,
    p_token_hash: hashInvitationToken(parsed.data.token),
  })
  if (error || !data?.[0]) return NextResponse.json({ error: 'Invitation is invalid or expired' }, { status: 403 })
  return NextResponse.json({ accepted: true, ...data[0] }, { headers: { 'Cache-Control': 'private, no-store' } })
}
