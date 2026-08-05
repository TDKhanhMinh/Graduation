import { Pin } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { FeedbackState } from "@/components/ui/feedback-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModerationWish } from "@/features/wishes/moderation-dal"

import { ModerationMediaPreview } from "./ModerationMediaPreview"

const statusCopy: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" | "neutral" }> = {
  pending: { label: "Chờ duyệt", tone: "warning" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Từ chối", tone: "danger" },
  hidden: { label: "Đã ẩn", tone: "neutral" },
}

function ModerationStatus({ status }: { status: string }) {
  const copy = statusCopy[status] || { label: status, tone: "neutral" as const }
  return <StatusBadge tone={copy.tone}>{copy.label}</StatusBadge>
}

export function ModerationQueue({
  wishes,
  selectedIds,
  selectedWishId,
  onSelectAll,
  onSelect,
  onInspect,
}: {
  wishes: ModerationWish[]
  selectedIds: string[]
  selectedWishId: string | null
  onSelectAll: (checked: boolean) => void
  onSelect: (id: string, checked: boolean) => void
  onInspect: (id: string) => void
}) {
  const isAllSelected = wishes.length > 0 && selectedIds.length === wishes.length

  if (wishes.length === 0) {
    return (
      <FeedbackState
        status="empty"
        title="Không tìm thấy lời chúc"
        description="Thử xóa bớt bộ lọc hoặc quay lại sau khi có lời chúc mới."
        className="min-h-52"
      />
    )
  }

  return (
    <div className="min-w-0">
      <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} aria-label="Chọn tất cả lời chúc" />
              </TableHead>
              <TableHead>Người gửi</TableHead>
              <TableHead>Nội dung & media</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wishes.map((wish) => (
              <TableRow
                key={wish.id}
                data-state={selectedWishId === wish.id ? "inspected" : selectedIds.includes(wish.id) ? "selected" : undefined}
                tabIndex={0}
                role="button"
                aria-label={`Inspect wish from ${wish.sender_name}`}
                aria-pressed={selectedWishId === wish.id}
                onClick={() => onInspect(wish.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onInspect(wish.id)
                  }
                }}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(wish.id)}
                    onCheckedChange={(checked) => onSelect(wish.id, Boolean(checked))}
                    aria-label={`Chọn lời chúc của ${wish.sender_name}`}
                  />
                </TableCell>
                <TableCell className="max-w-40 whitespace-normal font-medium">{wish.sender_name}</TableCell>
                <TableCell className="max-w-md whitespace-normal">
                  <p className="break-words text-sm leading-6">{wish.content || <span className="italic text-muted-foreground">Không có nội dung</span>}</p>
                  {wish.media ? <ModerationMediaPreview media={wish.media} /> : null}
                </TableCell>
                <TableCell><div className="flex flex-wrap items-center gap-2"><ModerationStatus status={wish.moderation_status} />{wish.is_pinned ? <StatusBadge tone="info"><Pin aria-hidden="true" className="mr-1 size-3" />Đã ghim</StatusBadge> : null}</div></TableCell>
                <TableCell className="whitespace-normal text-sm text-muted-foreground">
                  <time dateTime={wish.created_at}>{new Date(wish.created_at).toLocaleString("vi-VN")}</time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-3 py-3 shadow-sm">
          <label className="flex min-h-(--control-min-size) items-center gap-3 text-sm font-medium">
            <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} aria-label="Chọn tất cả lời chúc" />
            Chọn tất cả trên trang
          </label>
          <span className="text-xs text-muted-foreground">{selectedIds.length}/{wishes.length}</span>
        </div>
        {wishes.map((wish) => (
          <article
            key={wish.id}
            className="min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-colors focus-within:border-primary/40 hover:border-primary/30"
            data-state={selectedWishId === wish.id ? "inspected" : selectedIds.includes(wish.id) ? "selected" : undefined}
            tabIndex={0}
            role="button"
            aria-label={`Inspect wish from ${wish.sender_name}`}
            onClick={() => onInspect(wish.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                }
              }}
            >
            <div className="flex min-w-0 items-start gap-3">
              <Checkbox
                checked={selectedIds.includes(wish.id)}
                onCheckedChange={(checked) => onSelect(wish.id, Boolean(checked))}
                aria-label={`Chọn lời chúc của ${wish.sender_name}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium">{wish.sender_name}</h3>
                  <ModerationStatus status={wish.moderation_status} />
                  {wish.is_pinned ? <StatusBadge tone="info"><Pin aria-hidden="true" className="mr-1 size-3" />Đã ghim</StatusBadge> : null}
                </div>
                <time dateTime={wish.created_at} className="mt-1 block text-xs text-muted-foreground">{new Date(wish.created_at).toLocaleString("vi-VN")}</time>
              </div>
            </div>
            <p className="mt-4 break-words whitespace-pre-wrap text-sm leading-6">{wish.content || <span className="italic text-muted-foreground">Không có nội dung</span>}</p>
            {wish.media ? <ModerationMediaPreview media={wish.media} /> : null}
          </article>
        ))}
      </div>
    </div>
  )
}