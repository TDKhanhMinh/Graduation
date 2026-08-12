import 'server-only'

import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

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

type Event = Database['public']['Tables']['events']['Row']

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

export async function getAccessibleEventById(
  eventId: string,
  capability: EventCapability = 'event_read',
): Promise<Event | null> {
  const access = await requireEventCapability(eventId, capability)
  if (!access) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  return error || !data ? null : data
}

export async function getAccessibleEvents(): Promise<Event[]> {
  const session = await verifySession()
  if (!session) return []

  const admin = createAdminClient()
  const [{ data: owned, error: ownedError }, { data: memberships, error: membershipError }] = await Promise.all([
    admin.from('events').select('*').eq('owner_id', session.userId).is('deleted_at', null),
    admin.from('event_collaborators').select('event_id').eq('user_id', session.userId),
  ])

  if (ownedError || membershipError) return []

  const eventIds = Array.from(new Set((memberships ?? []).map((row) => row.event_id)))
  const { data: shared, error: sharedError } = eventIds.length
    ? await admin.from('events').select('*').in('id', eventIds).is('deleted_at', null)
    : { data: [], error: null }

  if (sharedError) return owned ?? []

  const events = new Map<string, Event>()
  for (const event of [...(owned ?? []), ...(shared ?? [])]) events.set(event.id, event)
  return [...events.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}
