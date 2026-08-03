"use client"

import { useState, useCallback } from "react"
import { type PublicWish } from "@/features/wishes/dal"
import { WishCard } from "./WishCard"
import { useRealtimeWallEvents, type RealtimeWallEvent } from "@/features/wishes/realtime"
import { WifiOff, RefreshCcw } from "lucide-react"

// We will use a server action passed as a prop for refetching!
export function RealtimeWall({
  eventId,
  initialWishes,
  fetchWishesAction
}: {
  eventId: string
  initialWishes: PublicWish[]
  fetchWishesAction: (eventId: string, limit: number) => Promise<PublicWish[]>
}) {
  const [wishes, setWishes] = useState<PublicWish[]>(initialWishes)
  const [isRefetching, setIsRefetching] = useState(false)

  const handleEvent = useCallback((event: RealtimeWallEvent) => {
    setWishes((currentWishes) => {
      if (event.action === 'remove') {
        return currentWishes.filter(w => w.id !== event.wish_id)
      } else if (event.action === 'upsert' && event.payload) {
        const exists = currentWishes.some(w => w.id === event.wish_id)
        if (exists) {
          // Update existing
          return currentWishes.map(w => w.id === event.wish_id ? (event.payload as PublicWish) : w)
        } else {
          // Add new (typically pinned goes top, else by date). 
          // For simplicity, prepend and let sorting be handled, or we can sort inline.
          const updated = [event.payload as PublicWish, ...currentWishes]
          // Sort by is_pinned desc, then created_at desc
          return updated.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        }
      }
      return currentWishes
    })
  }, [])

  const handleReconnect = useCallback(async () => {
    try {
      setIsRefetching(true)
      const freshWishes = await fetchWishesAction(eventId, Math.max(20, wishes.length))
      setWishes(freshWishes)
    } catch (err) {
      console.error("Failed to refetch wishes on reconnect", err)
    } finally {
      setIsRefetching(false)
    }
  }, [eventId, fetchWishesAction, wishes.length])

  const { status } = useRealtimeWallEvents(eventId, handleEvent, handleReconnect)

  return (
    <div className="relative">
      {status === 'disconnected' && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-50 animate-in fade-in slide-in-from-bottom-4">
          <WifiOff className="w-4 h-4" />
          Mất kết nối
        </div>
      )}
      
      {(status === 'reconnecting' || isRefetching) && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-50 animate-in fade-in slide-in-from-bottom-4">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          Đang đồng bộ...
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Chưa có lời chúc nào</h3>
          <p className="text-muted-foreground mb-6">
            Hãy là người đầu tiên gửi lời chúc!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 masonry-like">
          {wishes.map((wish) => (
            <WishCard key={wish.id} wish={wish} />
          ))}
        </div>
      )}
    </div>
  )
}
