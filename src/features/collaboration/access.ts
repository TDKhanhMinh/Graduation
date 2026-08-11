import 'server-only'

import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'

import {
  can,
  collaboratorRoleSchema,
  type CollaboratorRole,
  type EventCapability,
} from './permissions'

export type EventAccess = {
  userId: string
  role: CollaboratorRole
}

export async function getEventAccess(eventId: string): Promise<EventAccess | null> {
  const session = await verifySession()
  if (!session) return null

  const supabase = createAdminClient()
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,owner_id')
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError || !event) return null
  if (event.owner_id === session.userId) return { userId: session.userId, role: 'owner' }

  const { data: collaborator, error: collaboratorError } = await supabase
    .from('event_collaborators')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', session.userId)
    .maybeSingle()

  if (collaboratorError) return null
  const role = collaboratorRoleSchema.safeParse(collaborator?.role)
  return role.success ? { userId: session.userId, role: role.data } : null
}

export async function requireEventCapability(
  eventId: string,
  capability: EventCapability,
): Promise<EventAccess | null> {
  const access = await getEventAccess(eventId)
  return access && can(access.role, capability) ? access : null
}
