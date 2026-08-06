"use client"

import { Bell, ChevronLeft, ChevronRight, Pause, Play, QrCode, Sparkles, SkipForward } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { createTimelinePlan, useTimelinePlayback } from "@/features/wall/animations/timeline"
import { Button } from "@/components/ui/button"

type DirectorWish = {
  id: string
  senderName: string
  content: string
  hasMedia: boolean
}

export function DirectorMode({
  eventId,
  initialWishes,
  initialQrVisible,
  initialAnimationSpeed,
}: {
  eventId: string
  initialWishes: DirectorWish[]
  initialQrVisible: boolean
  initialAnimationSpeed: "slow" | "normal" | "fast"
}) {
  const [queue, setQueue] = useState(initialWishes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(initialAnimationSpeed)
  const [qrVisible, setQrVisible] = useState(initialQrVisible)
  const [celebration, setCelebration] = useState(false)
  const [notification, setNotification] = useState("Director Mode ready")
  const current = queue[currentIndex] ?? null
  const next = queue[currentIndex + 1] ?? null
  const { play: playTimeline } = useTimelinePlayback(false, () => setNotification("Current wish playback completed"))

  const playbackScale = speed === "slow" ? 1.25 : speed === "fast" ? 0.8 : 1
  const currentDuration = useMemo(() => {
    if (!current) return 0
    return Math.round(createTimelinePlan({ contentType: current.hasMedia ? "image" : "text" }).totalDuration * playbackScale)
  }, [current, playbackScale])

  function announce(message: string) {
    setNotification(message)
  }

  function selectNext() {
    if (!queue.length) return
    const index = Math.min(currentIndex + 1, queue.length - 1)
    setCurrentIndex(index)
    setIsPaused(false)
    const wish = queue[index]
    playTimeline(createTimelinePlan({ contentType: wish.hasMedia ? "image" : "text" }))
    announce("Next wish is now on stage")
  }

  function selectPrevious() {
    if (!queue.length) return
    const index = Math.max(currentIndex - 1, 0)
    setCurrentIndex(index)
    setIsPaused(false)
    const wish = queue[index]
    playTimeline(createTimelinePlan({ contentType: wish.hasMedia ? "image" : "text" }))
    announce("Previous wish is now on stage")
  }

  function skipCurrent() {
    if (!current) return
    setQueue((items) => items.filter((item) => item.id !== current.id))
    setCurrentIndex((index) => Math.min(index, Math.max(queue.length - 2, 0)))
    announce("Wish skipped for this local playback session")
    announce("Đã bỏ qua lời chúc trong phiên phát cục bộ")
  }

  return (
    <section className="space-y-6" aria-labelledby="director-mode-heading">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_90%_0%,var(--memory-peach)_0,transparent_32%),linear-gradient(135deg,var(--brand-50),var(--background)_72%)] p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bảng điều khiển (Host)</p>
          <h2 id="director-mode-heading" className="mt-1 font-heading text-xl font-semibold">Tùy chỉnh luồng hiển thị</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Điều khiển local playback cho màn hình public. Các thao tác không gọi public API và không thay đổi wish trong database.</p>
        </div>
        <Link href={`/dashboard/events/${eventId}/moderation`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">Mở moderation</Link>
      </div>

      <p role="status" aria-live="polite" className="rounded-xl border border-status-info/30 bg-status-info/10 px-4 py-3 text-sm text-status-info">{notification}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <div className="min-w-0 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Now playing</p>
              <p className="mt-1 text-lg font-semibold">{current ? current.senderName : "Queue empty"}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{current ? `${currentIndex + 1} / ${queue.length}` : "0 / 0"}</span>
          </div>

          <blockquote className="mt-5 rounded-2xl border border-primary/15 bg-[var(--brand-50)] p-5 text-base leading-7">
            {current?.content || "Chưa có lời chúc để phát."}
          </blockquote>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={selectPrevious} disabled={!current || currentIndex === 0}><ChevronLeft aria-hidden="true" />Previous</Button>
            <Button type="button" variant="outline" onClick={selectNext} disabled={!current || currentIndex >= queue.length - 1}><ChevronRight aria-hidden="true" />Next</Button>
            <Button type="button" variant={isPaused ? "default" : "soft"} onClick={() => { setIsPaused((value) => !value); announce(isPaused ? "Playback resumed" : "Playback paused") }} disabled={!current}>
              {isPaused ? <><Play aria-hidden="true" />Resume</> : <><Pause aria-hidden="true" />Pause</>}
            </Button>
            <Button type="button" variant="ghost" onClick={skipCurrent} disabled={!current}><SkipForward aria-hidden="true" />Skip local</Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">Timeline estimate: {currentDuration ? `${Math.round(currentDuration / 1000)}s` : "—"} · media uses a longer reveal window.</p>
        </div>

        <aside className="space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6" aria-label="Director controls">
          <h3 className="font-semibold">Stage controls</h3>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Playback speed</span>
            <select value={speed} onChange={(event) => { setSpeed(event.target.value as typeof speed); announce("Playback speed updated") }} className="min-h-11 rounded-xl border border-border/80 bg-background px-3">
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </label>
          <Button type="button" variant={qrVisible ? "soft" : "outline"} className="w-full justify-start" onClick={() => { setQrVisible((value) => !value); announce(qrVisible ? "QR hidden for this console" : "QR visible for this console") }}>
            <QrCode aria-hidden="true" />{qrVisible ? "QR visible" : "QR hidden"}
          </Button>
          <Button type="button" variant={celebration ? "default" : "outline"} className="w-full justify-start" onClick={() => { setCelebration(true); announce("Celebration cue armed for the public wall") }}>
            <Sparkles aria-hidden="true" />{celebration ? "Celebration armed" : "Celebration cue"}
          </Button>
          <Button type="button" variant="outline" className="w-full justify-start" onClick={() => announce("Host notification sent locally")}><Bell aria-hidden="true" />Notify screen</Button>
        </aside>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">Up next</h3>
        <p className="mt-1 text-sm text-muted-foreground">{next ? `${next.senderName}: ${next.content}` : "Queue has no next item."}</p>
      </div>
    </section>
  )
}
