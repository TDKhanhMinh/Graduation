import { Activity } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedbackState } from "@/components/ui/feedback-state"
import { StatusBadge } from "@/components/ui/status-badge"
import type { AuditLog } from "@/features/wishes/moderation-dal"

const actionLabels: Record<string, string> = {
  approve: "Duyệt",
  reject: "Từ chối",
  hide: "Ẩn",
  pin: "Ghim",
  unpin: "Bỏ ghim",
  soft_delete: "Xóa",
  restore: "Khôi phục",
}

export function AuditHistory({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Activity aria-hidden="true" className="size-4" />Lịch sử kiểm duyệt</CardTitle>
        <CardDescription>Các thay đổi gần đây của event này.</CardDescription>
      </CardHeader>
      <CardContent>
        {(!logs || logs.length === 0) ? (
          <FeedbackState status="empty" title="Chưa có hoạt động" description="Các thao tác kiểm duyệt sẽ xuất hiện tại đây." className="min-h-32 border-0 px-2 py-4" />
        ) : (
          <ol className="space-y-4" aria-label="Lịch sử thao tác kiểm duyệt">
            {logs.map((log) => (
              <li key={log.id} className="relative border-l-2 border-primary/30 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="info">{actionLabels[log.action] || log.action}</StatusBadge>
                  {log.wish_id ? <span className="text-xs text-muted-foreground">Lời chúc {log.wish_id.slice(0, 8)}…</span> : null}
                </div>
                <time dateTime={log.created_at} className="mt-1 block text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("vi-VN")}</time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}