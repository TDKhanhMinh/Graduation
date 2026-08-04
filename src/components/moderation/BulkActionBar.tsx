"use client"

import { CheckCircle, EyeOff, LoaderCircle, Pin, Trash2, X, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ModerationAction } from "@/features/wishes/moderation-schema"

export function BulkActionBar({
  selectedCount,
  isPending,
  onAction,
  onClear,
}: {
  selectedCount: number
  isPending: boolean
  onAction: (action: ModerationAction) => void
  onClear: () => void
}) {
  if (selectedCount === 0) return null

  return (
    <div
      className="fixed bottom-3 left-3 right-3 z-40 flex flex-col gap-3 rounded-xl border bg-popover px-4 py-3 text-popover-foreground shadow-lg sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-max sm:-translate-x-1/2 sm:flex-row sm:items-center"
      role="region"
      aria-label="Thao tác hàng loạt"
      aria-live="polite"
      aria-busy={isPending}
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="text-sm font-medium">Đã chọn {selectedCount} lời chúc</span>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} disabled={isPending} aria-label="Bỏ chọn tất cả" className="min-h-(--control-min-size) min-w-(--control-min-size)">
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t pt-3 sm:flex sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
        <Button type="button" variant="outline" onClick={() => onAction("approve")} disabled={isPending} className="min-h-(--control-min-size)">
          <CheckCircle aria-hidden="true" /> Duyệt
        </Button>
        <Button type="button" variant="outline" onClick={() => onAction("reject")} disabled={isPending} className="min-h-(--control-min-size) text-status-danger">
          <XCircle aria-hidden="true" /> Từ chối
        </Button>
        <Button type="button" variant="outline" onClick={() => onAction("hide")} disabled={isPending} className="min-h-(--control-min-size)">
          <EyeOff aria-hidden="true" /> Ẩn
        </Button>
        <Button type="button" variant="outline" onClick={() => onAction("pin")} disabled={isPending} className="min-h-(--control-min-size)">
          <Pin aria-hidden="true" /> Ghim
        </Button>
        <Button type="button" variant="destructive" onClick={() => onAction("soft_delete")} disabled={isPending} className="min-h-(--control-min-size)">
          <Trash2 aria-hidden="true" /> Xóa
        </Button>
      </div>
      {isPending ? <span className="sr-only" role="status">Đang xử lý thao tác hàng loạt…</span> : null}
      {isPending ? <LoaderCircle aria-hidden="true" className="absolute right-4 top-4 size-4 animate-spin" /> : null}
    </div>
  )
}