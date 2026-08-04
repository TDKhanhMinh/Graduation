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
}: {
  eventId: string
  wishes: ModerationWish[]
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

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
    if (selectedIds.length === 0) return

    startTransition(async () => {
      // Create expected versions map for optimistic concurrency control
      const expectedVersions = wishes
        .filter(w => selectedIds.includes(w.id))
        .reduce((acc, w) => {
          acc[w.id] = w.updated_at
          return acc
        }, {} as Record<string, string>)

      const result = await submitBulkModeration(eventId, {
        wishIds: selectedIds,
        action,
        expectedVersions
      })

      if (result.success) {
        setSelectedIds([]) // Reset selection on success
        toast.success(`Đã xử lý thành công ${selectedIds.length} lời chúc`)
      } else {
        toast.error(result.error || "Có lỗi xảy ra, vui lòng thử lại")
      }
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <ModerationFilters 
        currentStatus={searchParams.get("status") || ""} 
        currentSearch={searchParams.get("search") || ""}
        onFilterChange={handleFilterChange} 
      />
      
      <ModerationQueue 
        wishes={wishes}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelect={handleSelect}
      />

      <BulkActionBar 
        selectedCount={selectedIds.length}
        isPending={isPending}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
      />
    </div>
  )
}
