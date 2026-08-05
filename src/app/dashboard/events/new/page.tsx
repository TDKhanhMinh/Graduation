import { ChevronLeft } from "lucide-react"
import Link from "next/link"

import { createEvent } from "@/features/events/actions"
import { EventCreationPreview } from "@/components/events/event-creation-preview"
import { EventForm } from "@/components/events/EventForm"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Tạo sự kiện mới",
}

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        title="Tạo sự kiện mới"
        description="Điền thông tin để bắt đầu sự kiện của bạn."
        actions={
          <Link
            href="/dashboard"
            aria-label="Quay về dashboard"
            title="Quay về dashboard"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardContent className="pt-6">
            <EventForm action={createEvent} submitLabel="Tạo sự kiện" />
          </CardContent>
        </Card>
        <EventCreationPreview />
      </div>
    </div>
  )
}