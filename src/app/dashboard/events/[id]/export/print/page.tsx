import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ExportPrintView } from "@/components/exports/export-print-view"
import { getOwnerExportSnapshot } from "@/features/exports/dal"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EventExportPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await getOwnerExportSnapshot(id)

  if (!snapshot) notFound()

  return <ExportPrintView snapshot={snapshot} />
}
