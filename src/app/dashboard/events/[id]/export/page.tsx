import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOwnedEventById } from "@/features/events/dal"
import { ExportDashboardClient } from "@/components/export/ExportDashboardClient"

export const metadata: Metadata = {
  title: "Xuất bản",
}

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="py-6">
      <h2 className="text-xl font-semibold mb-6">Xuất bản lời chúc</h2>
      <ExportDashboardClient eventId={event.id} slug={event.slug} />
    </div>
  )
}
