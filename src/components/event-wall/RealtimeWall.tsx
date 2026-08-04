"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, RefreshCcw, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FeedbackState } from "@/components/ui/feedback-state"
import { type PublicWish } from "@/features/wishes/dal"
import { type RealtimeWallEvent, useRealtimeWallEvents } from "@/features/wishes/realtime"

import { WishCard } from "./WishCard"

type WallFilter = "all" | "pinned" | "media"
type WallSort = "newest" | "oldest"

export function RealtimeWall({
  eventId,
  initialWishes,
  fetchWishesAction,
}: {
  eventId: string
  initialWishes: PublicWish[]
  fetchWishesAction: (eventId: string, limit: number) => Promise<PublicWish[]>
}) {
  const [wishes, setWishes] = useState<PublicWish[]>(initialWishes)
  const [isRefetching, setIsRefetching] = useState(false)
  const [refetchError, setRefetchError] = useState(false)
  const [filter, setFilter] = useState<WallFilter>("all")
  const [sort, setSort] = useState<WallSort>("newest")
  const wishesLengthRef = useRef(initialWishes.length)

  useEffect(() => {
    wishesLengthRef.current = wishes.length
  }, [wishes.length])

  const handleEvent = useCallback((event: RealtimeWallEvent) => {
    setWishes((currentWishes) => {
      if (event.action === "remove") {
        return currentWishes.filter((wish) => wish.id !== event.wish_id)
      }

      if (event.action === "upsert" && event.payload) {
        const nextWish = event.payload as PublicWish
        const exists = currentWishes.some((wish) => wish.id === event.wish_id)
        const updated = exists
          ? currentWishes.map((wish) => (wish.id === event.wish_id ? nextWish : wish))
          : [nextWish, ...currentWishes]

        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      return currentWishes
    })
  }, [])

  const handleReconnect = useCallback(async () => {
    setIsRefetching(true)
    setRefetchError(false)

    try {
      const freshWishes = await fetchWishesAction(eventId, Math.max(20, wishesLengthRef.current))
      setWishes(freshWishes)
    } catch (error) {
      console.error("Failed to refetch wishes on reconnect", error)
      setRefetchError(true)
    } finally {
      setIsRefetching(false)
    }
  }, [eventId, fetchWishesAction])

  const visibleWishes = useMemo(() => {
    const filtered = wishes.filter((wish) => {
      if (filter === "pinned") return wish.is_pinned
      if (filter === "media") return Boolean(wish.media)
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filter, sort, wishes])

  const { status } = useRealtimeWallEvents(eventId, handleEvent, handleReconnect)
  const showConnectionNotice = status !== "connected" || isRefetching || refetchError

  return (
    <div
      className="min-w-0"
      aria-busy={isRefetching}
      data-testid="realtime-wall"
      data-connection-status={status}
    >
      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-40 flex-col gap-1 text-sm"><span className="font-medium">Filter wishes</span><select value={filter} onChange={(event) => setFilter(event.target.value as WallFilter)} className="min-h-(--control-min-size) rounded-lg border bg-background px-3"><option value="all">All wishes</option><option value="pinned">Pinned</option><option value="media">With media</option></select></label>
          <label className="flex min-w-40 flex-col gap-1 text-sm"><span className="font-medium">Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as WallSort)} className="min-h-(--control-min-size) rounded-lg border bg-background px-3"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        </div>
        {filter !== "all" || sort !== "newest" ? <Button type="button" variant="ghost" onClick={() => { setFilter("all"); setSort("newest") }}>Reset filters</Button> : null}
      </div>
      {showConnectionNotice ? (
        <div
          className={
            "mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between " +
            (refetchError
              ? "border-status-danger/30 bg-status-danger/10 text-status-danger"
              : "border-status-info/30 bg-status-info/10 text-status-info")
          }
          role={refetchError ? "alert" : "status"}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex min-w-0 items-start gap-3">
            {refetchError ? (
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            ) : status === "disconnected" ? (
              <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            ) : status === "connected" ? (
              <RefreshCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin" />
            ) : (
              <Wifi aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium">
                {refetchError
                  ? "Chưa thể đồng bộ lời chúc mới."
                  : status === "disconnected"
                    ? "Kết nối thời gian thực đã gián đoạn."
                    : status === "reconnecting" || isRefetching
                      ? "Đang kết nối lại và đồng bộ lời chúc…"
                      : "Đang kết nối với bức tường lời chúc…"}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {refetchError
                  ? "Các lời chúc đang hiển thị vẫn được giữ lại."
                  : "Bạn vẫn có thể đọc nội dung hiện có trong lúc chờ kết nối."}
              </p>
            </div>
          </div>
          {(status === "disconnected" || refetchError) && !isRefetching ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleReconnect()}
              className="min-h-(--control-min-size) shrink-0 border-current/30 bg-background/60"
            >
              <RefreshCcw aria-hidden="true" />
              Thử đồng bộ lại
            </Button>
          ) : null}
        </div>
      ) : null}

      {wishes.length === 0 ? (
        <FeedbackState
          status="empty"
          title="Chưa có lời chúc nào"
          description="Hãy là người đầu tiên gửi lời chúc để bắt đầu lưu giữ kỷ niệm tại đây."
          className="min-h-52"
        />
      ) : visibleWishes.length === 0 ? (
        <FeedbackState
          status="empty"
          title="No wishes match these filters"
          description="Reset the filters to see all approved wishes."
          action={<Button type="button" variant="outline" onClick={() => { setFilter("all"); setSort("newest") }}>Reset filters</Button>}
          className="min-h-52"
        />
      ) : (
        <div className="columns-1 min-w-0 gap-4 md:columns-2 lg:columns-3 min-[1440px]:columns-4">
          {visibleWishes.map((wish) => (
            <WishCard key={wish.id} wish={wish} className="mb-4" />
          ))}
        </div>
      )}

      {status === "connected" && !isRefetching && !refetchError ? (
        <p className="sr-only" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" /> Bức tường lời chúc đã được đồng bộ.
        </p>
      ) : null}
    </div>
  )
}