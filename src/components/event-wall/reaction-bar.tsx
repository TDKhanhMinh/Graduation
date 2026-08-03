"use client"
import { useOptimisticReactions } from "@/features/reactions/client"
import type { ReactionCount } from "@/features/reactions/dal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SmilePlus } from "lucide-react"

const ALLOWED_EMOJIS = ["❤️", "👍", "🎉", "😂", "🔥", "👏"]

export function ReactionBar({ initialCounts, wishId }: { initialCounts: ReactionCount[], wishId: string }) {
  const { reactions, toggle, inflight } = useOptimisticReactions(initialCounts, wishId)
  
  // Sort reactions so that active ones appear consistently
  const sortedReactions = [...reactions].sort((a, b) => b.count - a.count)
  
  return (
    <div className="flex flex-wrap gap-2 items-center mt-3">
      {sortedReactions.map(reaction => (
        <Button
          key={reaction.emoji}
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-2.5 rounded-full transition-all duration-200 ease-in-out font-medium",
            reaction.hasReacted ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" : "text-muted-foreground",
            inflight.has(reaction.emoji) && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => toggle(reaction.emoji)}
          disabled={inflight.has(reaction.emoji)}
          aria-label={`${reaction.emoji} (${reaction.count} reactions${reaction.hasReacted ? ', you reacted' : ''})`}
          aria-pressed={reaction.hasReacted}
        >
          <span className="mr-1.5 text-base leading-none">{reaction.emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger
          className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Add reaction"
        >
          <SmilePlus className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {ALLOWED_EMOJIS.map(emoji => {
              const current = reactions.find(r => r.emoji === emoji)
              const hasReacted = current?.hasReacted
              
              return (
                <Button
                  key={emoji}
                  variant={hasReacted ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 text-xl",
                    inflight.has(emoji) && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => toggle(emoji)}
                  disabled={inflight.has(emoji)}
                  aria-label={emoji}
                  aria-pressed={hasReacted}
                >
                  {emoji}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
