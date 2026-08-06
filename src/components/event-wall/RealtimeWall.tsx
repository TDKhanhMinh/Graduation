"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, LayoutGrid, Maximize2, RefreshCcw, Smartphone, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FeedbackState } from "@/components/ui/feedback-state"
import { WallLayer, WallStage } from "@/features/wall/components/wall-stage"
import { createTimelinePlan, useTimelinePlayback } from "@/features/wall/animations/timeline"
import { type PublicWish } from "@/features/wishes/dal"
import { type RealtimeWallEvent, useRealtimeWallEvents } from "@/features/wishes/realtime"
import { cn } from "@/lib/utils"
import { useEffectState } from "@/components/effects/effect-provider"

import { WishCard } from "./WishCard"
import type { EffectPreset } from "@/components/effects/effect-config"
import { MemoryConstellation } from "@/components/effects/memory-constellation"
import { WishSpotlightEffect } from "@/components/effects/wish-spotlight-effect"

type WallFilter = "all" | "pinned" | "media"
type WallSort = "newest" | "oldest"
type WallLayout = "spotlight" | "grid" | "photo-focus"
type WallAspect = "wide" | "portrait"

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
  const [layout, setLayout] = useState<WallLayout>("spotlight")
  const [aspect, setAspect] = useState<WallAspect>("wide")
  const { config: effectConfig, reducedMotion, setPreset, setIntensity } = useEffectState()
  const wishesLengthRef = useRef(initialWishes.length)
  const wishIdsRef = useRef(new Set(initialWishes.map((wish) => wish.id)))
  const [spotlightWishId, setSpotlightWishId] = useState<string | null>(null)
  const { play: playTimeline } = useTimelinePlayback(reducedMotion, () => setSpotlightWishId(null))

  useEffect(() => {
    wishesLengthRef.current = wishes.length
  }, [wishes.length])

  const handleEvent = useCallback((event: RealtimeWallEvent) => {
    if (event.action === "remove") {
      wishIdsRef.current.delete(event.wish_id)
      setWishes((currentWishes) => currentWishes.filter((wish) => wish.id !== event.wish_id))
      return
    }

    if (event.action === "upsert" && event.payload) {
      const nextWish = event.payload as PublicWish
      const isNewWish = !wishIdsRef.current.has(event.wish_id)
      wishIdsRef.current.add(event.wish_id)

      if (isNewWish) {
        setSpotlightWishId(event.wish_id)
        playTimeline(createTimelinePlan({ contentType: nextWish.media ? "image" : "text", reducedMotion }))
      }

      setWishes((currentWishes) => {
        const exists = currentWishes.some((wish) => wish.id === event.wish_id)
        const updated = exists
          ? currentWishes.map((wish) => (wish.id === event.wish_id ? nextWish : wish))
          : [nextWish, ...currentWishes]

        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })
    }
  }, [playTimeline, reducedMotion])

  const handleReconnect = useCallback(async () => {
    setIsRefetching(true)
    setRefetchError(false)

    try {
      const freshWishes = await fetchWishesAction(eventId, Math.max(20, wishesLengthRef.current))
      wishIdsRef.current = new Set(freshWishes.map((wish) => wish.id))
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
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--event-border)] bg-[var(--event-surface)] p-3 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-40 flex-col gap-1 text-sm"><span className="font-medium">Lọc lời chúc</span><select value={filter} onChange={(event) => setFilter(event.target.value as WallFilter)} className="min-h-(--control-min-size) rounded-xl border-[var(--event-border)] bg-background/70 px-3"><option value="all">Tất cả lời chúc</option><option value="pinned">Đã ghim</option><option value="media">Có tệp đa phương tiện</option></select></label>
          <label className="flex min-w-40 flex-col gap-1 text-sm"><span className="font-medium">Sắp xếp</span><select value={sort} onChange={(event) => setSort(event.target.value as WallSort)} className="min-h-(--control-min-size) rounded-xl border-[var(--event-border)] bg-background/70 px-3"><option value="newest">Mới nhất trước</option><option value="oldest">Cũ nhất trước</option></select></label>
        </div>
        {filter !== "all" || sort !== "newest" ? <Button type="button" variant="ghost" onClick={() => { setFilter("all"); setSort("newest") }}>Đặt lại bộ lọc</Button> : null}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--event-border)] bg-[var(--event-surface)] px-3 py-2.5" data-testid="wall-customizer">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Bố cục bức tường công khai">
          <span className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bố cục</span>
          {(["spotlight", "grid", "photo-focus"] as const).map((value) => <Button key={value} type="button" size="sm" variant={layout === value ? "default" : "ghost"} onClick={() => setLayout(value)} aria-pressed={layout === value}>{value === "spotlight" ? "Nổi bật" : value === "grid" ? <><LayoutGrid aria-hidden="true" />Lưới</> : "Ưu tiên ảnh"}</Button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tỷ lệ hiển thị bức tường công khai">
          <Button type="button" size="sm" variant={aspect === "wide" ? "soft" : "ghost"} onClick={() => setAspect("wide")} aria-pressed={aspect === "wide"}><Maximize2 aria-hidden="true" />16:9</Button>
          <Button type="button" size="sm" variant={aspect === "portrait" ? "soft" : "ghost"} onClick={() => setAspect("portrait")} aria-pressed={aspect === "portrait"}><Smartphone aria-hidden="true" />9:16</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Hiệu ứng bức tường công khai">
          <label className="flex items-center gap-2 text-xs font-medium">
            <span>Giao diện</span>
            <select value={effectConfig.preset} onChange={(event) => setPreset(event.target.value as EffectPreset)} className="min-h-(--control-min-size) rounded-xl border-[var(--event-border)] bg-background/70 px-2.5 text-sm">
              {(["minimal", "elegant", "romantic", "celebration", "graduation"] as const).map((value) => <option key={value} value={value}>{value === "minimal" ? "Tối giản" : value === "elegant" ? "Thanh lịch" : value === "romantic" ? "Lãng mạn" : value === "celebration" ? "Chúc mừng" : "Tốt nghiệp"}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-medium">
            <span>Cường độ</span>
            <select value={effectConfig.intensity} onChange={(event) => setIntensity(event.target.value as "off" | "low" | "medium" | "high")} className="min-h-(--control-min-size) rounded-xl border-[var(--event-border)] bg-background/70 px-2.5 text-sm">
              {(["off", "low", "medium", "high"] as const).map((value) => <option key={value} value={value}>{value === "off" ? "Tắt" : value === "low" ? "Thấp" : value === "medium" ? "Trung bình" : "Cao"}</option>)}
            </select>
          </label>
        </div>
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
        <div className="relative min-h-52 overflow-hidden rounded-2xl border border-[var(--event-border)] bg-black/5 p-4">
          <MemoryConstellation wishes={[]} preset={effectConfig.preset} intensity={effectConfig.intensity} mode="waiting" />
          <FeedbackState
            status="empty"
            title="Chưa có lời chúc nào"
            description="Hãy là người đầu tiên gửi lời chúc để bắt đầu lưu giữ kỷ niệm tại đây."
            className="relative z-10 min-h-52"
          />
        </div>
      ) : visibleWishes.length === 0 ? (
        <FeedbackState
          status="empty"
          title="Không có lời chúc nào phù hợp với bộ lọc"
          description="Đặt lại bộ lọc để xem tất cả lời chúc đã duyệt."
          action={<Button type="button" variant="outline" onClick={() => { setFilter("all"); setSort("newest") }}>Đặt lại bộ lọc</Button>}
          className="min-h-52"
        />
      ) : (
        <WallStage
          className={cn(aspect === "portrait" ? "rounded-2xl border border-[var(--event-border)] bg-black/5 p-[4vw]" : "rounded-2xl border border-[var(--event-border)] bg-black/5 p-[4vw]")}
          layout={layout}
          aspect={aspect}
        >
          <WallLayer name="ambient">
            <MemoryConstellation wishes={visibleWishes} preset={effectConfig.preset} intensity={effectConfig.intensity} mode={spotlightWishId ? "wall" : "summary"} className="z-0" />
          </WallLayer>
          <WallLayer name="effects">
            <WishSpotlightEffect wishId={effectConfig.particles && !reducedMotion ? spotlightWishId : null} />
          </WallLayer>
          <WallLayer name="content">
            <div className={cn(layout === "grid" && "grid gap-4 md:grid-cols-2 lg:grid-cols-3", layout === "photo-focus" && "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", layout === "spotlight" && "grid gap-5 lg:grid-cols-3")}>
              {visibleWishes.map((wish, index) => (
                <WishCard key={wish.id} wish={wish} reactionBurstEnabled={effectConfig.reactions && effectConfig.intensity !== "off" && !reducedMotion} isSpotlighted={spotlightWishId === wish.id} className={cn(layout === "spotlight" && index === 0 && "lg:col-span-2", layout === "photo-focus" && "min-h-64")} />
              ))}
            </div>
          </WallLayer>
        </WallStage>
      )}

      {status === "connected" && !isRefetching && !refetchError ? (
        <p className="sr-only" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" /> Bức tường lời chúc đã được đồng bộ.
        </p>
      ) : null}
    </div>
  )
}