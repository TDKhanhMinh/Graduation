import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ReactNode } from "react"

import { EventNav } from "@/components/dashboard/event-nav"
import { SectionHeading } from "@/components/ui/section-heading"
import { buttonVariants } from "@/components/ui/button"
import { getOwnedEventById } from "@/features/events/dal"
import { cn } from "@/lib/utils"

export default async function EventLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        as="h1"
        title={event.title}
        description={"/" + event.slug}
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

      <EventNav eventId={event.id} />

      <div>{children}</div>
    </div>
  )
}