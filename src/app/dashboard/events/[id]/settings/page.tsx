import { notFound } from "next/navigation"

import { getOwnedEventById } from "@/features/events/dal"
import { updateEvent } from "@/features/events/actions"
import { EventForm } from "@/components/events/EventForm"
import { ArchiveEventControl } from "@/components/events/ArchiveEventControl"

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

  // Bind the eventId to the update action
  const boundUpdateAction = updateEvent.bind(null, event.id)

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
        <div className="p-4 sm:p-6 bg-card rounded-lg border shadow-sm">
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
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-destructive">Khu vực nguy hiểm</h2>
        <div className="p-4 sm:p-6 bg-card rounded-lg border border-destructive/20 shadow-sm">
          <ArchiveEventControl eventId={event.id} isArchived={!!event.archived_at} />
        </div>
      </div>
    </div>
  )
}
