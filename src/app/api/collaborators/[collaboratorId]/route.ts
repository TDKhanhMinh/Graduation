import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'
import { getOwnedEventById } from '@/features/events/dal'
import { createAdminClient } from '@/lib/supabase/admin'

const bodySchema = z.object({
  eventId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(['editor', 'moderator', 'viewer']).optional(),
})

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } })
}

async function getOwner(request: Request, body: unknown) {
  const session = await verifySession()
  if (!session) return { error: response({ error: 'Unauthorized' }, 401) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return { error: response({ error: 'Invalid collaborator request' }, 400) }
  const event = await getOwnedEventById(parsed.data.eventId)
  if (!event) return { error: response({ error: 'Event not found' }, 404) }
  return { session, parsed }
}

export async function PATCH(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return response({ error: 'Invalid request body' }, 400) }
  const owner = await getOwner(request, body)
  if (owner.error) return owner.error
  if (!owner.parsed.data.role) return response({ error: 'Role is required' }, 400)
  const { data, error } = await createAdminClient().rpc('set_event_collaborator_role', {
    p_event_id: owner.parsed.data.eventId,
    p_owner_id: owner.session.userId,
    p_user_id: owner.parsed.data.userId,
    p_role: owner.parsed.data.role,
  })
  if (error) return response({ error: 'Collaborator role could not be updated' }, 500)
  return response({ updated: data === true })
}

export async function DELETE(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return response({ error: 'Invalid request body' }, 400) }
  const owner = await getOwner(request, body)
  if (owner.error) return owner.error
  const { data, error } = await createAdminClient().rpc('remove_event_collaborator', {
    p_event_id: owner.parsed.data.eventId,
    p_owner_id: owner.session.userId,
    p_user_id: owner.parsed.data.userId,
  })
  if (error) return response({ error: 'Collaborator could not be removed' }, 500)
  return response({ removed: data === true })
}
