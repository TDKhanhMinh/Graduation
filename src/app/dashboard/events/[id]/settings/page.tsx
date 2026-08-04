import { AlertTriangle } from "lucide-react"
import { notFound } from "next/navigation"

import { ArchiveEventControl } from "@/components/events/ArchiveEventControl"
import { EventForm } from "@/components/events/EventForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { getOwnedEventById } from "@/features/events/dal"
import { updateEvent } from "@/features/events/actions"

export const metadata = {
  title: "Cài đặt sự kiện",
}

export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  const boundUpdateAction = updateEvent.bind(null, event.id)

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading
        title="Cài đặt"
        description="Quản lý thông tin, khả năng hiển thị và luồng nhận lời chúc của sự kiện."
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin và hành vi</CardTitle>
          <CardDescription>
            Thay đổi sẽ được giữ lại khi action trả lỗi; trạng thái lưu và thay đổi chưa lưu
            được thông báo ngay trong form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            action={boundUpdateAction}
            submitLabel="Lưu thay đổi"
            initialData={{
              title: event.title,
              slug: event.slug,
              description: event.description || "",
              visibility: event.visibility,
              submission_mode: event.submission_mode,
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-status-danger/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-status-danger" />
            <div className="min-w-0">
              <CardTitle className="text-status-danger">Khu vực nguy hiểm</CardTitle>
              <CardDescription className="mt-1">
                Hành động tại đây ảnh hưởng đến khả năng truy cập và nhận lời chúc của sự kiện.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ArchiveEventControl eventId={event.id} isArchived={!!event.archived_at} />
        </CardContent>
      </Card>
    </div>
  )
}