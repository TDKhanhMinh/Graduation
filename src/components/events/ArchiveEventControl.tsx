"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { archiveEvent } from "@/features/events/actions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function ArchiveEventControl({
  eventId,
  isArchived,
}: {
  eventId: string
  isArchived: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const executeArchive = () => {
    startTransition(async () => {
      try {
        await archiveEvent(eventId)
        setShowConfirm(false)
        toast.success("Đã lưu trữ sự kiện thành công.")
      } catch (error) {
        console.error(error)
        toast.error("Có lỗi xảy ra khi lưu trữ sự kiện.")
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-medium text-status-danger">Lưu trữ sự kiện</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Sự kiện sẽ bị vô hiệu hóa, không nhận thêm lời chúc và ẩn khỏi danh sách
            hoạt động.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowConfirm(true)}
          disabled={isArchived || isPending}
          aria-busy={isPending}
          className="min-h-(--control-min-size) shrink-0"
        >
          {isPending
            ? "Đang xử lý…"
            : isArchived
              ? "Đã lưu trữ"
              : "Lưu trữ sự kiện"}
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        variant="warning"
        title="Lưu trữ sự kiện này?"
        description="Sự kiện sẽ chuyển sang trạng thái lưu trữ, ngừng hiển thị công khai và tạm dừng nhận tất cả các lời chúc mới từ khách tham dự."
        confirmText="Lưu trữ sự kiện"
        cancelText="Hủy bỏ"
        isPending={isPending}
        onConfirm={executeArchive}
      />
    </>
  )
}