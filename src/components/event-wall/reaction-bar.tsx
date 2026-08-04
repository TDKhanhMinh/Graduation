"use client"

import { SmilePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOptimisticReactions } from "@/features/reactions/client"
import type { ReactionCount } from "@/features/reactions/dal"
import { cn } from "@/lib/utils"

const ALLOWED_EMOJIS = ["❤️", "👍", "🎉", "😂", "🔥", "👏"]

export function ReactionBar({
  initialCounts,
  wishId,
}: {
  initialCounts: ReactionCount[]
  wishId: string
}) {
  const { reactions, toggle, inflight, error } = useOptimisticReactions(initialCounts, wishId)
  const sortedReactions = [...reactions].sort((a, b) => b.count - a.count)

  return (
    <div className="mt-4 min-w-0" aria-label="Tương tác lời chúc">
      {error ? (
        <p
          className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {sortedReactions.map((reaction) => {
          const isPending = inflight.has(reaction.emoji)

          return (
            <Button
              key={reaction.emoji}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "min-h-(--control-min-size) min-w-14 rounded-full px-3 font-medium transition-colors",
                reaction.hasReacted
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground",
                isPending && "cursor-wait opacity-60",
              )}
              onClick={() => void toggle(reaction.emoji)}
              disabled={isPending}
              aria-label={reaction.emoji + ", " + reaction.count + " lượt phản ứng" + (reaction.hasReacted ? ", bạn đã chọn" : "")}
              aria-pressed={reaction.hasReacted}
              aria-busy={isPending}
            >
              <span className="text-base leading-none" aria-hidden="true">
                {reaction.emoji}
              </span>
              <span className="text-xs tabular-nums">{reaction.count}</span>
            </Button>
          )
        })}

        <Popover>
          <PopoverTrigger
            type="button"
            className="inline-flex min-h-(--control-min-size) min-w-(--control-min-size) items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus/50"
            aria-label="Thêm phản ứng"
            title="Thêm phản ứng"
          >
            <SmilePlus aria-hidden="true" className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1" aria-label="Chọn phản ứng">
              {ALLOWED_EMOJIS.map((emoji) => {
                const current = reactions.find((reaction) => reaction.emoji === emoji)
                const hasReacted = current?.hasReacted ?? false
                const isPending = inflight.has(emoji)

                return (
                  <Button
                    key={emoji}
                    type="button"
                    variant={hasReacted ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "min-h-(--control-min-size) min-w-(--control-min-size) p-0 text-xl focus-visible:ring-3 focus-visible:ring-focus/50",
                      isPending && "cursor-wait opacity-60",
                    )}
                    onClick={() => void toggle(emoji)}
                    disabled={isPending}
                    aria-label={"Chọn phản ứng " + emoji}
                    aria-pressed={hasReacted}
                    aria-busy={isPending}
                  >
                    {emoji}
                  </Button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}