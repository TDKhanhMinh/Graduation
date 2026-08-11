import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExportCenter } from "@/components/exports/export-center"
import { getOwnedEventById } from "@/features/events/dal"
import { getOwnerExportSnapshot } from "@/features/exports/dal"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EventExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) notFound()

  const snapshot = await getOwnerExportSnapshot(event.id)
  if (!snapshot) notFound()

  return <ExportCenter snapshot={snapshot} />
}
