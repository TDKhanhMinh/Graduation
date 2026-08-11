"use client"

import { Button } from "@/components/ui/button"

export default function EventExportError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="font-semibold">Không thể tải Export Center</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Snapshot export đang tạm thời không khả dụng. Bạn có thể thử lại mà không mất dữ liệu.
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={() => reset()}>
        Thử lại
      </Button>
      {error.digest ? <span className="sr-only">Mã lỗi {error.digest}</span> : null}
    </div>
  )
}
