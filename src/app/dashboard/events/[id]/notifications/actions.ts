'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { verifySession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

const uuid = z.string().uuid()

type NotificationActionResult = {
  success: boolean
  error?: string
}

const invalidRequest: NotificationActionResult = {
  success: false,
  error: 'Yêu cầu thông báo không hợp lệ.',
}

const notAllowed: NotificationActionResult = {
  success: false,
  error: 'Bạn không có quyền cập nhật thông báo này.',
}

export async function markNotificationRead(
  eventId: string,
  notificationId: string,
): Promise<NotificationActionResult> {
  if (!uuid.safeParse(eventId).success || !uuid.safeParse(notificationId).success) {
    return invalidRequest
  }

  const session = await verifySession()
  if (!session) return notAllowed

  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  })

  if (error) return notAllowed

  revalidatePath(`/dashboard/events/${eventId}`)
  return { success: true }
}

export async function markAllNotificationsRead(
  eventId: string,
): Promise<NotificationActionResult> {
  if (!uuid.safeParse(eventId).success) return invalidRequest

  const session = await verifySession()
  if (!session) return notAllowed

  const supabase = await createClient()
  const { error } = await supabase.rpc('mark_all_notifications_read', {
    p_event_id: eventId,
  })

  if (error) return notAllowed

  revalidatePath(`/dashboard/events/${eventId}`)
  return { success: true }
}

export async function setPendingWishNotifications(
  eventId: string,
  enabled: boolean,
): Promise<NotificationActionResult> {
  if (!uuid.safeParse(eventId).success || typeof enabled !== 'boolean') {
    return invalidRequest
  }

  const session = await verifySession()
  if (!session) return notAllowed

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_notification_preferences', {
    p_event_id: eventId,
    p_pending_wish_enabled: enabled,
  })

  if (error) return notAllowed

  revalidatePath(`/dashboard/events/${eventId}`)
  return { success: true }
}
