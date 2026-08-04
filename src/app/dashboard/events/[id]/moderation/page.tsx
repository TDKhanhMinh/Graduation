import { AuditHistory } from "@/components/moderation/AuditHistory"
import { ModerationClientWrapper } from "@/components/moderation/ModerationClientWrapper"
import { getAuditHistory, getModerationQueue } from "@/features/wishes/moderation-dal"
import { Suspense } from "react"

export default async function ModerationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { id } = await params
  const { status, search, dateFrom, dateTo, page: pageParam } = await searchParams
  const pageSize = 50
  const parsedPage = Number.parseInt(pageParam ?? "1", 10)
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const filters = {
    status: status,
    search: search,
    dateFrom: dateFrom,
    dateTo: dateTo,
  }

  const [{ data: wishes, count }, auditLogs] = await Promise.all([
    getModerationQueue(id, filters, pageSize, (currentPage - 1) * pageSize),
    getAuditHistory(id, 10),
  ])

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="flex-1 w-full min-w-0">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Moderation Queue
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({count} total)
          </span>
        </h2>
        
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-md" />}>
          <ModerationClientWrapper
            eventId={id}
            wishes={wishes}
            totalCount={count}
            currentPage={currentPage}
            pageSize={pageSize}
          />
        </Suspense>
      </div>

      <div className="w-full lg:w-80 lg:shrink-0">
        <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-md" />}>
          <AuditHistory logs={auditLogs} />
        </Suspense>
      </div>
    </div>
  )
}
