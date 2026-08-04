"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { submitBulkModeration } from "@/app/dashboard/events/[id]/moderation/actions"
import { ModerationFilters } from "./ModerationFilters"
import { ModerationQueue } from "./ModerationQueue"
import { BulkActionBar } from "./BulkActionBar"
import { type ModerationWish } from "@/features/wishes/moderation-dal"
import { type ModerationAction } from "@/features/wishes/moderation-schema"
import { toast } from "sonner"

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(wishes.map((w) => w.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  const handleBulkAction = (action: ModerationAction) => {
    if (visibleSelectedIds.length === 0) return
    if (action === "soft_delete" && !window.confirm("Delete the selected wishes?")) return

    startTransition(async () => {
      // Create expected versions map for optimistic concurrency control
      const expectedVersions = wishes
        .filter(w => visibleSelectedIds.includes(w.id))
        .reduce((acc, w) => {
          acc[w.id] = w.updated_at
          return acc
        }, {} as Record<string, string>)

      const result = await submitBulkModeration(eventId, {
        wishIds: visibleSelectedIds,
        action,
        expectedVersions
      })

      if (result.success) {
        setSelectedIds([]) // Reset selection on success
        toast.success(`Đã xử lý thành công ${visibleSelectedIds.length} lời chúc`)
      } else {
        toast.error(result.error || "Có lỗi xảy ra, vui lòng thử lại")
      }
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (key !== "page") params.delete("page")
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
      router.push(`?${params.toString()}`)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6">
      <ModerationFilters 
        currentStatus={searchParams.get("status") || ""} 
        currentSearch={searchParams.get("search") || ""}
        currentDateFrom={searchParams.get("dateFrom") || ""}
        currentDateTo={searchParams.get("dateTo") || ""}
        onFilterChange={handleFilterChange} 
      />
      
      <ModerationQueue 
        wishes={wishes}
        selectedIds={visibleSelectedIds}
        onSelectAll={handleSelectAll}
        onSelect={handleSelect}
      />

      <BulkActionBar 
        selectedCount={visibleSelectedIds.length}
        isPending={isPending}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between" aria-label="Pagination">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => handleFilterChange("page", String(currentPage - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => handleFilterChange("page", String(currentPage + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
