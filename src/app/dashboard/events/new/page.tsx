import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventForm } from "@/components/events/EventForm"
import { createEvent } from "@/features/events/actions"

export const metadata = {
  title: "Tạo sự kiện mới",
}

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button aria-label="Quay về dashboard" variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo sự kiện mới</h1>
          <p className="text-muted-foreground">Điền thông tin để bắt đầu sự kiện của bạn.</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-card rounded-lg border shadow-sm">
        <EventForm action={createEvent} submitLabel="Tạo sự kiện" />
      </div>
    </div>
  )
}
