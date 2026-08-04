import { CalendarPlus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { getOwnedEvents } from "@/features/events/dal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FeedbackState } from "@/components/ui/feedback-state"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"

export const metadata = {
  title: "Dashboard",
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        title="Sự kiện của bạn"
        description="Quản lý các sự kiện và lời chúc trong một workspace thống nhất."
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
  const events = await getOwnedEvents()

  if (events.length === 0) {
    return (
      <FeedbackState
        status="empty"
        title="Chưa có sự kiện nào"
        description="Tạo sự kiện đầu tiên để bắt đầu nhận lời chúc từ khách mời."
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

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total events</p>
            <p className="mt-2 text-3xl font-semibold">{events.length}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active events</p>
            <p className="mt-2 text-3xl font-semibold">{activeEvents}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Closed submissions</p>
            <p className="mt-2 text-3xl font-semibold">{closedEvents}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
      {events.map((event) => {
        const isArchived = Boolean(event.archived_at)

        return (
          <Card key={event.id} className="min-w-0 lg:col-span-4">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="min-w-0 truncate">{event.title}</CardTitle>
                <StatusBadge tone={isArchived ? "neutral" : "success"}>
                  {isArchived ? "Đã lưu trữ" : "Đang hoạt động"}
                </StatusBadge>
              </div>
              <CardDescription className="line-clamp-2">
                {event.description || "Chưa có mô tả"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="info">{event.visibility}</StatusBadge>
                <StatusBadge tone={event.submission_mode === "closed" ? "warning" : "neutral"}>
                  {event.submission_mode === "closed"
                    ? "Đã đóng nhận lời chúc"
                    : "Đang nhận lời chúc"}
                </StatusBadge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                Đường dẫn: <span className="font-medium text-foreground">/{event.slug}</span>
              </p>
            </CardContent>
            <CardFooter>
              <Link href={"/dashboard/events/" + event.id + "/settings"} className="w-full">
                <Button variant="secondary" className="min-h-(--control-min-size) w-full">
                  Quản lý sự kiện
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
    </div>
  )
}