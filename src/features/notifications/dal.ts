import 'server-only'

import { cache } from 'react'

import { verifySession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export type EventNotification = {
  id: string
  event_id: string
  wish_id: string
  kind: 'pending_wish'
  read_at: string | null
  created_at: string
}

export type NotificationSnapshot = {
  status: 'ready' | 'error'
  notifications: EventNotification[]
  unreadCount: number
  pendingWishEnabled: boolean
}

const emptySnapshot = (status: NotificationSnapshot['status']): NotificationSnapshot => ({
  status,
  notifications: [],
  unreadCount: 0,
  pendingWishEnabled: true,
})

export const getEventNotificationSnapshot = cache(async (
  eventId: string,
): Promise<NotificationSnapshot> => {
  const session = await verifySession()
  if (!session) return emptySnapshot('ready')

  const supabase = await createClient()
  const [notificationsResult, unreadResult, preferencesResult] = await Promise.all([
    supabase
      .from('notification_events')
      .select('id,event_id,wish_id,kind,read_at,created_at')
      .eq('event_id', eventId)
      .eq('recipient_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('notification_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('recipient_id', session.userId)
      .is('read_at', null),
    supabase
      .from('notification_preferences')
      .select('pending_wish_enabled')
      .eq('event_id', eventId)
      .eq('owner_id', session.userId)
      .maybeSingle(),
  ])

  const hasError = Boolean(
    notificationsResult.error || unreadResult.error || preferencesResult.error,
  )

  return {
    status: hasError ? 'error' : 'ready',
    notifications: (notificationsResult.data ?? []) as EventNotification[],
    unreadCount: unreadResult.count ?? 0,
    pendingWishEnabled: preferencesResult.data?.pending_wish_enabled ?? true,
  }
})
