import { ArrowUpRight, CalendarDays, CalendarPlus, ImageIcon, MessageCircleHeart, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

import { getAccessibleEvents } from "@/features/collaboration/access"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedbackState } from "@/components/ui/feedback-state"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"

export const metadata = {
  title: "Bảng điều khiển",
}

const themeSurfaces: Record<string, string> = {
  graduation: "from-[var(--brand-100)] via-[var(--memory-peach)]/30 to-[var(--memory-pink)]/25",
  editorial: "from-amber-100 via-orange-50 to-rose-100",
  minimal: "from-slate-100 via-white to-[var(--brand-100)]",
}

function getCoverUrl(path: string | null) {
  return path && /^https:\/\/res\.cloudinary\.com\//.test(path) ? path : null
}

function formatEventDate(value: string | null) {
  if (!value) return "Chưa chọn ngày"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Ngày chưa xác định"
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date)
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        title="Sự kiện của bạn"
        description="Quản lý các không gian lưu giữ lời chúc trong một không gian làm việc thống nhất."
        actions={
          <Link href="/dashboard/events/new">
            <Button className="min-h-(--control-min-size)">
              <CalendarPlus aria-hidden="true" />
              Tạo sự kiện
            </Button>
          </Link>
        }
      />

      <Suspense
        fallback={
          <FeedbackState
            status="loading"
            title="Đang tải sự kiện"
            description="Đang lấy danh sách sự kiện của bạn."
          />
        }
      >
        <EventList />
      </Suspense>
    </div>
  )
}

async function EventList() {
  const events = await getAccessibleEvents()

  if (events.length === 0) {
    return (
      <FeedbackState
        status="empty"
        title="Chưa có sự kiện nào"
        description="Tạo không gian đầu tiên để bắt đầu nhận lời chúc từ khách mời."
        action={
          <Link href="/dashboard/events/new">
            <Button>Tạo sự kiện mới</Button>
          </Link>
        }
      />
    )
  }

  const activeEvents = events.filter((event) => !event.archived_at).length
  const closedEvents = events.filter((event) => event.submission_mode === "closed").length
  const stats = [
    { label: "Tổng sự kiện", value: events.length, Icon: Sparkles, tone: "text-primary", surface: "bg-primary/10" },
    { label: "Đang hoạt động", value: activeEvents, Icon: CalendarDays, tone: "text-status-success", surface: "bg-status-success/10" },
    { label: "Đã đóng nhận lời chúc", value: closedEvents, Icon: MessageCircleHeart, tone: "text-memory-pink", surface: "bg-memory-pink/10" },
  ] as const

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon, tone, surface }) => (
          <Card key={label} className="border-border/80 bg-card shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${surface} ${tone}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Tất cả không gian</p>
          <p className="mt-1 text-sm text-muted-foreground">Mở một sự kiện để tiếp tục chỉnh sửa hoặc chia sẻ.</p>
        </div>
        <span className="hidden text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:block">{events.length} không gian</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const isArchived = Boolean(event.archived_at)
          const coverUrl = getCoverUrl(event.cover_path)
          const themeSurface = themeSurfaces[event.theme_key] ?? themeSurfaces.graduation

          return (
            <Card key={event.id} className="group min-w-0 overflow-hidden border-border/80 bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${themeSurface}`}>
                {coverUrl ? <Image src={coverUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {coverUrl ? <ImageIcon aria-hidden="true" className="size-4" /> : <Sparkles aria-hidden="true" className="size-4" />}
                    <span>{event.theme_key === "graduation" ? "Tốt nghiệp" : event.theme_key === "editorial" ? "Biên tập" : "Tối giản"}</span>
                  </div>
                  <StatusBadge tone={isArchived ? "neutral" : "success"}>{isArchived ? "Đã lưu trữ" : "Đang hoạt động"}</StatusBadge>
                </div>
              </div>

              <CardHeader className="gap-3 pb-3">
                <CardTitle className="truncate text-lg">{event.title}</CardTitle>
                <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {event.description || "Chưa có mô tả cho không gian này."}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="info">{event.visibility === "public" ? "Công khai" : event.visibility === "private" ? "Riêng tư" : "Không liệt kê"}</StatusBadge>
                  <StatusBadge tone={event.submission_mode === "closed" ? "warning" : "neutral"}>
                    {event.submission_mode === "closed" ? "Đã đóng nhận lời chúc" : "Đang nhận lời chúc"}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  <span>{formatEventDate(event.event_date)}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">/e/{event.slug}</p>
              </CardContent>
              <CardFooter className="grid grid-cols-[1fr_auto] gap-2 border-t bg-surface-sunken/40 pt-4">
                <Link href={`/dashboard/events/${event.id}`}>
                  <Button variant="soft" className="min-h-(--control-min-size) w-full">Quản lý</Button>
                </Link>
                <Link href={`/e/${event.slug}`} target="_blank" rel="noreferrer" aria-label={`Mở trang ${event.title}`}>
                  <Button variant="ghost" size="icon" className="size-(--control-min-size)"><ArrowUpRight aria-hidden="true" /></Button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
