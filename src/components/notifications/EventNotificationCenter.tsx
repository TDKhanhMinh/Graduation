'use client'

import { Bell, CheckCheck, Inbox, LoaderCircle, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  markAllNotificationsRead,
  markNotificationRead,
  setPendingWishNotifications,
} from '@/app/dashboard/events/[id]/notifications/actions'
import { Button } from '@/components/ui/button'
import type { EventNotification, NotificationSnapshot } from '@/features/notifications/dal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}

export function EventNotificationCenter({
  eventId,
  status,
  notifications,
  unreadCount,
  pendingWishEnabled,
}: { eventId: string } & NotificationSnapshot) {
  const router = useRouter()
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [pendingPreferenceOverride, setPendingPreferenceOverride] = useState<boolean | null>(null)
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notification-events:${eventId}`, { config: { private: true } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_events',
          filter: `event_id=eq.${eventId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [eventId, router])

  const updateReadState = (notificationId: string) => {
    setPendingNotificationId(notificationId)
    startTransition(async () => {
      const result = await markNotificationRead(eventId, notificationId)
      if (!result.success) {
        toast.error(result.error ?? 'Không thể cập nhật thông báo.')
      } else {
        router.refresh()
      }
      setPendingNotificationId(null)
    })
  }

  const updateAllReadState = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead(eventId)
      if (!result.success) {
        toast.error(result.error ?? 'Không thể cập nhật thông báo.')
      } else {
        router.refresh()
      }
    })
  }

  const updatePreference = (enabled: boolean) => {
    setPendingPreferenceOverride(enabled)
    startTransition(async () => {
      const result = await setPendingWishNotifications(eventId, enabled)
      if (!result.success) {
        setPendingPreferenceOverride(null)
        toast.error(result.error ?? 'Không thể lưu tùy chọn thông báo.')
        return
      }
      setPendingPreferenceOverride(null)
      toast.success(enabled ? 'Đã bật thông báo lời chúc chờ duyệt.' : 'Đã tắt thông báo lời chúc chờ duyệt.')
      router.refresh()
    })
  }

  return (
    <section
      aria-labelledby={`event-notifications-heading-${eventId}`}
      className='rounded-3xl border border-border/80 bg-card p-4 shadow-sm sm:p-5'
      data-testid='event-notification-center'
    >
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 items-start gap-3'>
          <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Bell aria-hidden='true' className='size-4' />
          </span>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 id={`event-notifications-heading-${eventId}`} className='font-heading text-lg font-semibold'>
                Thông báo kiểm duyệt
              </h2>
              {unreadCount > 0 ? (
                <span className='inline-flex min-w-6 items-center justify-center rounded-full bg-status-info/15 px-2 py-1 text-xs font-semibold text-status-info' role='status' aria-label={`${unreadCount} thông báo chưa đọc`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </div>
            <p className='mt-1 text-sm leading-6 text-muted-foreground'>Thông báo chỉ hiển thị cho chủ sự kiện và không chứa nội dung lời chúc.</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {unreadCount > 0 ? (
            <Button type='button' size='sm' variant='ghost' disabled={isPending} onClick={updateAllReadState}>
              <CheckCheck aria-hidden='true' /> Đánh dấu đã đọc
            </Button>
          ) : null}
          <Button
            type='button'
            size='sm'
            variant='outline'
            aria-expanded={preferencesOpen}
            aria-controls={`event-notification-preferences-${eventId}`}
            onClick={() => setPreferencesOpen((open) => !open)}
          >
            <Settings2 aria-hidden='true' /> Tùy chọn
          </Button>
        </div>
      </div>

      {preferencesOpen ? (
        <div id={`event-notification-preferences-${eventId}`} className='mt-4 rounded-2xl border border-border/70 bg-surface-sunken p-4'>
          <label htmlFor={`pending-wish-notifications-${eventId}`} className='flex cursor-pointer items-start gap-3'>
            <input
              id={`pending-wish-notifications-${eventId}`}
              type='checkbox'
              className='mt-1 size-4 accent-primary'
              checked={pendingPreferenceOverride ?? pendingWishEnabled}
              disabled={isPending}
              onChange={(event) => updatePreference(event.target.checked)}
            />
            <span>
              <span className='block text-sm font-medium'>Lời chúc mới cần duyệt</span>
              <span className='mt-1 block text-xs leading-5 text-muted-foreground'>Bật thông báo in-app cho mỗi lời chúc pending mới. Email, SMS và push chưa thuộc v1.</span>
            </span>
          </label>
        </div>
      ) : null}

      <div className='mt-4'>
        {status === 'error' ? (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-danger/25 bg-status-danger/5 p-4 text-sm' role='alert'>
            <span>Không thể tải thông báo lúc này.</span>
            <Button type='button' size='sm' variant='outline' onClick={() => router.refresh()}>Thử lại</Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className='flex items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-surface-sunken p-4' role='status'>
            <Inbox aria-hidden='true' className='size-5 shrink-0 text-muted-foreground' />
            <div>
              <p className='text-sm font-medium'>Chưa có thông báo mới</p>
              <p className='mt-1 text-xs leading-5 text-muted-foreground'>Khi có lời chúc cần duyệt, thông báo sẽ xuất hiện ở đây.</p>
            </div>
          </div>
        ) : (
          <ul className='space-y-2' aria-label='Danh sách thông báo kiểm duyệt'>
            {notifications.map((notification: EventNotification) => {
              const unread = notification.read_at === null
              const isReading = pendingNotificationId === notification.id
              return (
                <li key={notification.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${unread ? 'border-primary/25 bg-primary/5' : 'border-border/70'}`} data-unread={unread} data-testid='notification-item'>
                  <Link
                    href={`/dashboard/events/${eventId}/moderation?wish_id=${encodeURIComponent(notification.wish_id)}`}
                    className='min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50'
                    onClick={() => unread && updateReadState(notification.id)}
                  >
                    <span className='block text-sm font-medium'>Có lời chúc mới đang chờ duyệt</span>
                    <span className='mt-1 block text-xs text-muted-foreground'>{formatDate(notification.created_at)}</span>
                  </Link>
                  {unread ? (
                    <Button type='button' size='icon-sm' variant='ghost' disabled={isPending} aria-label='Đánh dấu thông báo đã đọc' onClick={() => updateReadState(notification.id)}>
                      {isReading ? <LoaderCircle aria-hidden='true' className='animate-spin' /> : <CheckCheck aria-hidden='true' />}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
