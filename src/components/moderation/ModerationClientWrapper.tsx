"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { submitBulkModeration } from "@/app/dashboard/events/[id]/moderation/actions"
import { Button } from "@/components/ui/button"
import { ModerationFilters } from "./ModerationFilters"
import { ModerationQueue } from "./ModerationQueue"
import { ModerationDetailPanel } from "./ModerationDetailPanel"
import { BulkActionBar } from "./BulkActionBar"
import type { ModerationWish } from "@/features/wishes/moderation-dal"
import type { ModerationAction } from "@/features/wishes/moderation-schema"

export function ModerationClientWrapper({
  eventId,
  wishes,
  totalCount,
  currentPage,
  pageSize,
}: {
  eventId: string
  wishes: ModerationWish[]
  totalCount: number
  currentPage: number
  pageSize: number
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const visibleSelectedIds = selectedIds.filter((id) => wishes.some((wish) => wish.id === id))
  const [selectedWishId, setSelectedWishId] = useState<string | null>(wishes[0]?.id ?? null)
  const selectedWish = wishes.find((wish) => wish.id === selectedWishId) ?? wishes[0] ?? null

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? wishes.map((wish) => wish.id) : [])
  }

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((previous) => checked ? [...new Set([...previous, id])] : previous.filter((value) => value !== id))
  }

  const handleBulkAction = (action: ModerationAction) => {
    if (visibleSelectedIds.length === 0) return
    if (action === "soft_delete" && !window.confirm("Bạn có chắc muốn xóa các lời chúc đã chọn? Thao tác này không thể hoàn tác trong giao diện.")) return

    startTransition(async () => {
      try {
        const expectedVersions = wishes
          .filter((wish) => visibleSelectedIds.includes(wish.id))
          .reduce((acc, wish) => ({ ...acc, [wish.id]: wish.updated_at }), {} as Record<string, string>)
        const result = await submitBulkModeration(eventId, { wishIds: visibleSelectedIds, action, expectedVersions })

        if (!result.success) {
          toast.error(result.error || "Không thể xử lý. Dữ liệu có thể đã thay đổi, vui lòng thử lại.")
          return
        }

        setSelectedIds([])
        toast.success(`Đã xử lý ${visibleSelectedIds.length} lời chúc thành công.`)
        router.refresh()
      } catch (error) {
        console.error(error)
        toast.error("Không thể xử lý lúc này. Vui lòng thử lại.")
      }
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (key !== "page") params.delete("page")
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => router.replace("?", { scroll: false })
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className={"space-y-6 " + (visibleSelectedIds.length > 0 ? "pb-40 sm:pb-24" : "") }>
      <ModerationFilters
        currentStatus={searchParams.get("status") || ""}
        currentSearch={searchParams.get("search") || ""}
        currentDateFrom={searchParams.get("dateFrom") || ""}
        currentDateTo={searchParams.get("dateTo") || ""}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />


      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:items-start">
        <ModerationQueue
          wishes={wishes}
          selectedIds={visibleSelectedIds}
          selectedWishId={selectedWish?.id ?? null}
          onSelectAll={handleSelectAll}
          onSelect={handleSelect}
          onInspect={setSelectedWishId}
        />
        <div className="min-w-0 lg:sticky lg:top-6">
          <ModerationDetailPanel wish={selectedWish} />
        </div>
      </div>

      <BulkActionBar selectedCount={visibleSelectedIds.length} isPending={isPending} onAction={handleBulkAction} onClear={() => setSelectedIds([])} />

      {totalPages > 1 ? (
        <nav className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang hàng đợi kiểm duyệt">
          <span className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages} · {totalCount} lời chúc</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={currentPage <= 1} onClick={() => handleFilterChange("page", String(currentPage - 1))} className="min-h-(--control-min-size)">Trang trước</Button>
            <Button type="button" variant="outline" disabled={currentPage >= totalPages} onClick={() => handleFilterChange("page", String(currentPage + 1))} className="min-h-(--control-min-size)">Trang sau</Button>
          </div>
        </nav>
      ) : null}
    </div>
  )
}