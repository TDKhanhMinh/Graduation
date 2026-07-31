"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { archiveEvent } from "@/features/events/actions"
import { useRouter } from "next/navigation"

export function ArchiveEventControl({ eventId, isArchived }: { eventId: string, isArchived: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleArchive = () => {
    if (window.confirm("Bạn có chắc chắn muốn lưu trữ sự kiện này? Sự kiện sẽ không còn hiển thị và ngừng nhận lời chúc.")) {
      startTransition(async () => {
        try {
          await archiveEvent(eventId)
          router.push("/dashboard")
        } catch (error) {
          console.error(error)
          alert("Có lỗi xảy ra khi lưu trữ sự kiện.")
        }
      })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-medium text-destructive">Lưu trữ sự kiện</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Sự kiện sẽ bị vô hiệu hóa, không nhận thêm lời chúc và ẩn khỏi danh sách hoạt động.
        </p>
      </div>
      <Button 
        variant="destructive" 
        onClick={handleArchive} 
        disabled={isArchived || isPending}
      >
        {isPending ? "Đang xử lý..." : isArchived ? "Đã lưu trữ" : "Lưu trữ sự kiện"}
      </Button>
    </div>
  )
}
