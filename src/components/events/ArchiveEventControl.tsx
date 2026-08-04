"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { archiveEvent } from "@/features/events/actions"
import { Button } from "@/components/ui/button"

export function ArchiveEventControl({
  eventId,
  isArchived,
}: {
  eventId: string
  isArchived: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null)

  const handleArchive = () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn lưu trữ sự kiện này? Sự kiện sẽ không còn hiển thị và ngừng nhận lời chúc."
      )
    ) {
      return
    }

    setFeedback(null)
    startTransition(async () => {
      try {
        await archiveEvent(eventId)
        setFeedback("success")
        toast.success("Đã lưu trữ sự kiện thành công.")
      } catch (error) {
        console.error(error)
        setFeedback("error")
        toast.error("Có lỗi xảy ra khi lưu trữ sự kiện.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-medium text-status-danger">Lưu trữ sự kiện</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Sự kiện sẽ bị vô hiệu hóa, không nhận thêm lời chúc và ẩn khỏi danh sách
          hoạt động.
        </p>
        {feedback === "success" ? (
          <p className="mt-2 text-sm text-status-success" role="status">
            Đã lưu trữ sự kiện.
          </p>
        ) : null}
        {feedback === "error" ? (
          <p className="mt-2 text-sm text-status-danger" role="alert">
            Không thể lưu trữ sự kiện. Vui lòng thử lại.
          </p>
        ) : null}
      </div>
      <Button
        variant="destructive"
        onClick={handleArchive}
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
  )
}