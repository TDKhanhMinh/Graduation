import { Suspense } from "react"

import { ModerationMediaGallery } from "@/components/media/ModerationMediaGallery"
import { AuditHistory } from "@/components/moderation/AuditHistory"
import { ModerationClientWrapper } from "@/components/moderation/ModerationClientWrapper"
import { FeedbackState } from "@/components/ui/feedback-state"
import { SectionHeading } from "@/components/ui/section-heading"
import { getAuditHistory, getModerationQueue } from "@/features/wishes/moderation-dal"

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
  const filters = { status, search, dateFrom, dateTo }
  const [{ data: wishes, count }, auditLogs] = await Promise.all([
    getModerationQueue(id, filters, pageSize, (currentPage - 1) * pageSize),
    getAuditHistory(id, 10),
  ])

  return (
    <div className="min-w-0 space-y-7 pb-10">
      <SectionHeading
        title="Kiểm duyệt lời chúc"
        description="Lọc, xem trước an toàn và xử lý từng hoặc nhiều lời chúc."
      />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          <Suspense fallback={<FeedbackState status="loading" title="Đang tải hàng đợi" />}>
            <ModerationClientWrapper eventId={id} wishes={wishes} totalCount={count} currentPage={currentPage} pageSize={pageSize} />
          </Suspense>
        </div>
        <div className="min-w-0 lg:sticky lg:top-6">
          <Suspense fallback={<FeedbackState status="loading" title="Đang tải lịch sử" />}>
            <AuditHistory logs={auditLogs} />
          </Suspense>
        </div>      </div>
      <ModerationMediaGallery wishes={wishes} />
    </div>
  )
}
