import { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getOwnedEventById } from "@/features/events/dal"

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
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button aria-label="Quay về dashboard" variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground">/{event.slug}</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b">
        <Link href={`/dashboard/events/${event.id}`}>
          <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-muted data-[active=true]:border-primary data-[active=true]:bg-transparent">
            Tổng quan
          </Button>
        </Link>
        <Link href={`/dashboard/events/${event.id}/settings`}>
          <Button variant="ghost" className="rounded-none border-b-2 border-transparent hover:border-muted data-[active=true]:border-primary data-[active=true]:bg-transparent">
            Cài đặt
          </Button>
        </Link>
      </div>

      <div>
        {children}
      </div>
    </div>
  )
}
