"use client"

import Image from "next/image"

import type { WelcomeHeroConfig } from "@/features/events/welcome-config"
import { cn } from "@/lib/utils"

type WelcomeHeroPreviewProps = {
  eventTitle: string
  eventDescription: string
  eventDate?: string | null
  cover: string
  coverIsCloudinary: boolean
  previewTheme: string
  experienceLabel: string
  qualityLabel: string
  viewport: "desktop" | "tv" | "mobile" | "fullscreen"
  qrVisible: boolean
  qrCta: string
  reducedMotion: boolean
  config: WelcomeHeroConfig
}

function formatPreviewDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export function WelcomeHeroPreview({
  eventTitle,
  eventDescription,
  eventDate,
  cover,
  coverIsCloudinary,
  previewTheme,
  experienceLabel,
  qualityLabel,
  viewport,
  qrVisible,
  qrCta,
  reducedMotion,
  config,
}: WelcomeHeroPreviewProps) {
  const previewLayout = config.layout === "poster-focus" ? "poster-focus" : "split"
  const isSplit = previewLayout === "split" && viewport !== "mobile"
  const dateLabel = config.showDate ? formatPreviewDate(eventDate) : null
  const message = config.message || eventDescription || "Lời chào tùy chỉnh sẽ hiển thị tại đây."
  const objectPosition = config.poster.position === "top" ? "center top" : config.poster.position === "bottom" ? "center bottom" : "center"

  return (
    <div
      data-event-theme={previewTheme}
      data-welcome-layout={previewLayout}
      data-welcome-enabled={config.enabled}
      data-welcome-preview-motion={reducedMotion ? "reduced" : "full"}
      className={cn(
        "event-theme overflow-hidden rounded-2xl border bg-[var(--event-surface)]",
        config.poster.shadow ? "shadow-xl" : "shadow-none",
      )}
    >
      <div className={cn("relative min-h-[30rem]", isSplit ? "flex flex-col md:flex-row items-center" : "flex flex-col")}>
        <div className={cn(
          "welcome-hero-content relative z-10 flex min-w-0 flex-col justify-center gap-4 p-5 sm:p-8",
          isSplit ? "order-1 flex-1" : "order-2",
          !config.enabled && "order-1",
        )} style={{ backgroundColor: "var(--event-background)", color: "var(--event-text)" }}>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
            <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--event-border)" }}>{previewLayout === "poster-focus" ? "Poster Focus" : "Cinematic Split"}</span>
            <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--event-border)" }}>{reducedMotion ? "Reduced motion" : "Motion preview"}</span>
            {!config.enabled ? <span className="rounded-full border border-status-warning/40 bg-status-warning/10 px-2 py-1 text-status-warning">Tắt Welcome</span> : null}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--event-primary)" }}>Memoria</p>
          <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">{eventTitle}</h2>
          <p className="max-w-2xl text-sm leading-6" style={{ color: "var(--event-muted)" }}>{message}</p>
          {dateLabel ? <p className="text-xs font-medium" style={{ color: "var(--event-muted)" }}>{dateLabel}</p> : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="inline-flex rounded-full px-4 py-2 text-sm font-medium" style={{ backgroundColor: "var(--event-primary)", color: "var(--event-on-primary)" }}>{config.primaryLabel}</span>
            <span className="inline-flex rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--event-border)" }}>{config.secondaryLabel}</span>
          </div>
        </div>

        {config.enabled ? (
          <div className={cn(
            "relative overflow-hidden rounded-xl lg:rounded-2xl shadow-lg border border-border/50",
            isSplit ? "order-2 w-full md:w-2/5 shrink-0" : "order-1 w-full",
            config.poster.aspectRatio === "square" ? "aspect-square" :
            config.poster.aspectRatio === "landscape" ? "aspect-video" :
            config.poster.aspectRatio === "portrait" ? "aspect-[3/4]" :
            "min-h-[24rem]"
          )}>
            {coverIsCloudinary ? (
              <>
                {config.poster.backgroundBlur ? <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl" style={{ backgroundImage: `url(${cover})` }} /> : null}
                <Image
                  src={cover}
                  alt={`${eventTitle} cover preview`}
                  fill
                  loading="lazy"
                  sizes={isSplit ? "40vw" : "100vw"}
                  className={cn("relative", config.poster.fit === "contain" ? "object-contain" : "object-cover")}
                  style={{ objectPosition }}
                />
              </>
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" aria-hidden="true" />
            {!coverIsCloudinary ? (
              <div className="relative flex min-h-56 items-end bg-[radial-gradient(circle_at_20%_20%,var(--event-secondary),transparent_45%),linear-gradient(135deg,var(--event-primary),var(--event-secondary))] p-5 text-white">
                <div className="max-w-xs rounded-2xl border border-white/30 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-sm font-medium">Chưa có ảnh bìa Cloudinary</p>
                  <p className="mt-1 text-xs leading-5 text-white/80">Preview vẫn giữ nhận diện bằng nền gradient an toàn.</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2" style={{ backgroundColor: "var(--event-surface)" }}>
        <article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}>
          <p className="text-sm leading-6">Một lời chúc được duyệt sẽ xuất hiện ở đây.</p>
          <p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>Chỉ hiển thị nội dung đã duyệt</p>
        </article>
        <article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}>
          <p className="text-sm leading-6">{qrVisible ? "Mã QR sẽ hiển thị theo cấu hình." : "Mã QR đã được ẩn theo cấu hình."}</p>
          <p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>{qrVisible ? qrCta : "Gửi lời chúc"} · {experienceLabel} · {qualityLabel}</p>
        </article>
      </div>
    </div>
  )
}