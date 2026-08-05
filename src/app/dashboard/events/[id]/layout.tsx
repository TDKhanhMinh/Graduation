import { CalendarDays, ChevronLeft, ExternalLink } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { EventNav } from "@/components/dashboard/event-nav"
import { Button, buttonVariants } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"
import { getOwnedEventById } from "@/features/events/dal"
import { cn } from "@/lib/utils"

function formatDate(value: string | null) {
  if (!value) return "Chưa chọn ngày"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Ngày chưa xác định" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date)
}

export default async function EventLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getOwnedEventById(id)
  if (!event) notFound()

  const publicUrl = `/e/${event.slug}`
  const isArchived = Boolean(event.archived_at)

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 rounded-3xl border border-primary/15 bg-[radial-gradient(circle_at_85%_0%,var(--memory-peach)_0,transparent_28%),linear-gradient(135deg,var(--brand-50),var(--background)_72%)] p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone={isArchived ? "neutral" : "success"}>{isArchived ? "Đã lưu trữ" : "Đang hoạt động"}</StatusBadge>
            <StatusBadge tone="info">{event.visibility}</StatusBadge>
          </div>
          <SectionHeading as="h1" title={event.title} description={`/${event.slug}`} />
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" />{formatDate(event.event_date)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={publicUrl} target="_blank" rel="noreferrer"><Button variant="soft" className="min-h-(--control-min-size)"><ExternalLink aria-hidden="true" />Mở trang công khai</Button></Link>
          <Link href="/dashboard" aria-label="Quay về dashboard" title="Quay về dashboard" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}><ChevronLeft aria-hidden="true" /></Link>
        </div>
      </div>

      <EventNav eventId={event.id} />
      <div>{children}</div>
    </div>
  )
}