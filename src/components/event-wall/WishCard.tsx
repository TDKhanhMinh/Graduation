import { Pin } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import type { PublicWish } from "@/features/wishes/dal"
import { cn } from "@/lib/utils"

import { PublicAvatar } from "./PublicAvatar"
import { PublicMediaRenderer } from "./PublicMediaRenderer"
import { ReactionBar } from "./reaction-bar"

export function WishCard({ wish }: { wish: PublicWish }) {
  return (
    <Card
      className={cn(
        "min-w-0 overflow-hidden transition-shadow hover:shadow-md",
        wish.is_pinned && "border-primary/50 shadow-sm"
      )}
      data-pinned={wish.is_pinned ? "true" : "false"}
    >
      <CardHeader className="flex min-w-0 flex-row items-center gap-3 space-y-0 px-4 pb-2 pt-4">
        {wish.sender_avatar_path ? (
          <PublicAvatar wishId={wish.id} path={wish.sender_avatar_path} alt={wish.sender_name} />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold"
          >
            {wish.sender_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{wish.sender_name}</p>
          <time
            dateTime={wish.created_at}
            className="mt-1 block text-xs text-muted-foreground"
          >
            {new Date(wish.created_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        {wish.is_pinned ? (
          <StatusBadge tone="info" className="ml-auto shrink-0">
            <Pin aria-hidden="true" className="mr-1 size-3" />
            Ghim
          </StatusBadge>
        ) : null}
      </CardHeader>
      <CardContent className="min-w-0 px-4 pb-4 pt-2">
        <p className="break-words whitespace-pre-wrap text-sm leading-6">{wish.content}</p>
        {wish.media ? <PublicMediaRenderer wishId={wish.id} media={wish.media} /> : null}
        <ReactionBar initialCounts={wish.reactions || []} wishId={wish.id} />
      </CardContent>
    </Card>
  )
}