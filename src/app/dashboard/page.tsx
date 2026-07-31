import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getOwnedEvents } from "@/features/events/dal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export const metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sự kiện của bạn</h1>
          <p className="text-muted-foreground">
            Quản lý các sự kiện và lời chúc.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo sự kiện
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-10">Đang tải danh sách sự kiện...</div>}>
        <EventList />
      </Suspense>
    </div>
  )
}

async function EventList() {
  const events = await getOwnedEvents()

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Chưa có sự kiện nào</h2>
          <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            Bạn chưa tạo sự kiện nào. Hãy tạo sự kiện đầu tiên để bắt đầu nhận lời chúc.
          </p>
          <Link href="/dashboard/events/new">
            <Button>Tạo sự kiện mới</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-1">{event.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {event.description || "Không có mô tả"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Đường dẫn: <span className="font-medium text-foreground">/{event.slug}</span></p>
              <p>Trạng thái: <span className="font-medium text-foreground">{event.archived_at ? 'Đã lưu trữ' : 'Hoạt động'}</span></p>
              <p>Hiển thị: <span className="font-medium text-foreground capitalize">{event.visibility}</span></p>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <Link href={`/dashboard/events/${event.id}/settings`} className="w-full">
              <Button variant="secondary" className="w-full">
                Quản lý
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
