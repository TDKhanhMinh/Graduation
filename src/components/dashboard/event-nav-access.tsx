'use client'

import { BarChart3, Clapperboard, Download, LayoutDashboard, Palette, QrCode, Settings, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { can, type CollaboratorRole, type EventCapability } from '@/features/collaboration/permissions'

const items: readonly {
  segment: string
  label: string
  Icon: typeof LayoutDashboard
  capability?: EventCapability
  ownerOnly?: boolean
}[] = [
  { segment: '', label: 'T\u1ed5ng quan', Icon: LayoutDashboard, capability: 'event_read' },
  { segment: '/moderation', label: 'Ki\u1ec3m duy\u1ec7t', Icon: ShieldCheck, capability: 'moderation' },
  { segment: '/settings', label: 'C\u00e0i \u0111\u1eb7t', Icon: Settings, capability: 'event_settings' },
  { segment: '/collaborators', label: 'C\u1ed9ng t\u00e1c vi\u00ean', Icon: Users, ownerOnly: true },
  { segment: '/appearance', label: 'Giao di\u1ec7n', Icon: Settings, capability: 'event_settings' },
  { segment: '/poster-studio', label: 'X\u01b0\u1edfng \u00e1p ph\u00edch', Icon: Palette, ownerOnly: true },
  { segment: '/director', label: '\u0110\u1ea1o di\u1ec5n', Icon: Clapperboard, ownerOnly: true },
  { segment: '/sharing', label: 'Chia s\u1ebb & QR', Icon: QrCode, ownerOnly: true },
  { segment: '/insights', label: 'PhÃ¢n t\u00edch', Icon: BarChart3, capability: 'insights' },
  { segment: '/export', label: 'Xu\u1ea5t d\u1eef li\u1ec7u', Icon: Download, capability: 'export' },
]

export function EventNavAccess({
  eventId,
  role,
  notificationUnreadCount = 0,
}: {
  eventId: string
  role: CollaboratorRole
  notificationUnreadCount?: number
}) {
  const pathname = usePathname()
  const basePath = `/dashboard/events/${eventId}`

  return (
    <nav aria-label='\u0110i\u1ec1u h\u01b0\u1edbng s\u1ef1 ki\u1ec7n' className='space-y-2'>
      <div className='-mx-2 overflow-x-auto px-2 pb-px'>
        <ul className='flex min-w-max gap-1 border-b'>
          {items.map(({ segment, label, Icon, capability, ownerOnly }) => {
            const href = basePath + segment
            const isActive = segment ? pathname.startsWith(href) : pathname === basePath
            const available = ownerOnly ? role === 'owner' : capability ? can(role, capability) : false

            if (!available) return null

            return (
              <li key={href} className='shrink-0'>
                <Link href={href} aria-current={isActive ? 'page' : undefined} className={cn('inline-flex min-h-(--control-min-size) items-center gap-2 rounded-t-xl border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50', isActive ? 'border-primary bg-primary/8 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
                  <Icon aria-hidden='true' className='size-4 shrink-0' />
                  <span>{label}</span>
                  {segment === '/moderation' && notificationUnreadCount > 0 ? (
                    <span className='inline-flex min-w-5 items-center justify-center rounded-full bg-status-info/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-info' aria-label={`${notificationUnreadCount} th\u00f4ng b\u00e1o ch\u01b0a \u0111\u1ecdc`}>
                      {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      <p className='text-xs leading-5 text-muted-foreground'>C\u00e1c m\u1ee5c hi\u1ec3n th\u1ecb theo vai tr\u00f2 v\u00e0 capability c\u1ee7a b\u1ea1n.</p>
    </nav>
  )
}
