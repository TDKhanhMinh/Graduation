import { notFound } from "next/navigation"
import Link from "next/link"
import { ExternalLink, Settings, LayoutTemplate } from "lucide-react"

import { getOwnedEventById } from "@/features/events/dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  const publicUrl = `/e/${event.slug}`

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Truy cập công khai
          </CardTitle>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{event.visibility}</div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {publicUrl}
          </p>
          <div className="mt-4">
            <Link href={publicUrl} target="_blank">
              <Button size="sm" variant="outline" className="w-full">Mở trang sự kiện</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Trạng thái nhận lời chúc
          </CardTitle>
          <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{event.submission_mode}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {event.submission_mode === 'open' && "Nhận và tự động đăng"}
            {event.submission_mode === 'approval_required' && "Cần duyệt trước khi đăng"}
            {event.submission_mode === 'closed' && "Đã đóng nhận lời chúc"}
          </p>
          <div className="mt-4">
            <Link href={`/dashboard/events/${event.id}/settings`}>
              <Button size="sm" variant="secondary" className="w-full">
                <Settings className="mr-2 h-4 w-4" /> Cài đặt
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
