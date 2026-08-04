import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedbackState } from "@/components/ui/feedback-state"
import { StatusBadge } from "@/components/ui/status-badge"
import type { ModerationWish } from "@/features/wishes/moderation-dal"

import { ModerationMediaPreview } from "./ModerationMediaPreview"

export function ModerationDetailPanel({ wish }: { wish: ModerationWish | null }) {
  if (!wish) {
    return (
      <FeedbackState
        status="empty"
        title="Select a wish"
        description="Choose a row to inspect its content and media."
        className="min-h-52"
      />
    )
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="truncate">{wish.sender_name}</CardTitle>
        <CardDescription>
          <time dateTime={wish.created_at}>{new Date(wish.created_at).toLocaleString("vi-VN")}</time>
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{wish.moderation_status}</StatusBadge>
          {wish.is_pinned ? <StatusBadge tone="info">Pinned</StatusBadge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-surface-sunken p-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {wish.content || <span className="italic text-muted-foreground">No content</span>}
          </p>
        </div>
        {wish.media ? <ModerationMediaPreview media={wish.media} /> : null}
        <p className="text-xs leading-5 text-muted-foreground">
          Bulk actions remain available below the queue and keep the selected count visible.
        </p>
      </CardContent>
    </Card>
  )
}
