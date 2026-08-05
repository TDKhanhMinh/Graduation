"use client"

import { AudioLines, Image as ImageIcon, Info, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import type { ModerationWish } from "@/features/wishes/moderation-dal"

import { ModerationMediaPreview } from "@/components/moderation/ModerationMediaPreview"

type MediaFilter = "all" | "image" | "audio"

type GalleryMedia = NonNullable<ModerationWish["media"]> & {
  wishId: string
  senderName: string
  createdAt: string
  moderationStatus: string
}

function toGalleryMedia(wishes: ModerationWish[]): GalleryMedia[] {
  return wishes.flatMap((wish) => wish.media ? [{ ...wish.media, wishId: wish.id, senderName: wish.sender_name, createdAt: wish.created_at, moderationStatus: wish.moderation_status }] : [])
}

export function ModerationMediaGallery({ wishes }: { wishes: ModerationWish[] }) {
  const [filter, setFilter] = useState<MediaFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const media = useMemo(() => toGalleryMedia(wishes), [wishes])
  const visibleMedia = media.filter((item) => filter === "all" || item.media_type === filter)
  const selected = visibleMedia.find((item) => item.wishId === selectedId) ?? visibleMedia[0] ?? null

  return (
    <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 shadow-sm sm:p-5" aria-labelledby="moderation-media-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Media surface</p>
          <h2 id="moderation-media-heading" className="mt-1 font-heading text-xl font-semibold">Media trong hàng đợi</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Chỉ hiển thị media đã gắn với wish trong trang hiện tại. Upload và xóa vẫn bị khóa khi chưa có contract an toàn.</p>
        </div>
        <div className="flex rounded-xl border bg-background p-1" role="group" aria-label="Lọc media">
          {(["all", "image", "audio"] as const).map((value) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "ghost"} onClick={() => { setFilter(value); setSelectedId(null) }} aria-pressed={filter === value}>{value === "all" ? "Tất cả" : value === "image" ? "Ảnh" : "Audio"}</Button>)}
        </div>
      </div>

      {visibleMedia.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed bg-surface-sunken px-5 py-8 text-center">
          <div><Info className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Chưa có media phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Media unavailable hoặc chưa có trong trang hàng đợi sẽ không được bịa preview.</p></div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMedia.map((item) => {
              const isSelected = selected?.wishId === item.wishId
              return <button key={item.wishId} type="button" onClick={() => setSelectedId(item.wishId)} aria-pressed={isSelected} className={`min-w-0 rounded-2xl border p-2 text-left transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 ${isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border/80 hover:-translate-y-0.5 hover:border-primary/40"}`}><div className="relative overflow-hidden rounded-xl bg-surface-sunken"><ModerationMediaPreview media={item} /></div><div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3"><span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium">{item.media_type === "image" ? <ImageIcon className="size-3.5 shrink-0" /> : <AudioLines className="size-3.5 shrink-0" />}{item.senderName}</span><StatusBadge tone={item.moderationStatus === "approved" ? "success" : item.moderationStatus === "rejected" ? "danger" : "warning"}>{item.moderationStatus}</StatusBadge></div></button>
            })}
          </div>

          {selected ? <aside className="min-w-0 rounded-2xl border border-primary/15 bg-primary/5 p-4" aria-label="Chi tiết media đã chọn"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Selected asset</p><h3 className="mt-1 truncate font-semibold">{selected.senderName}</h3></div><Button type="button" size="icon" variant="ghost" onClick={() => setSelectedId(null)} aria-label="Bỏ chọn media"><X aria-hidden="true" /></Button></div><div className="mt-4"><ModerationMediaPreview media={selected} /></div><dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Loại</dt><dd className="font-medium">{selected.media_type}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Trạng thái wish</dt><dd className="font-medium">{selected.moderationStatus}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Kích thước</dt><dd className="font-medium">{selected.width && selected.height ? `${selected.width} × ${selected.height}` : "Không có metadata"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Thời gian</dt><dd className="font-medium">{selected.duration_ms ? `${Math.round(selected.duration_ms / 1000)}s` : "—"}</dd></div></dl></aside> : null}
        </div>
      )}
    </section>
  )
}