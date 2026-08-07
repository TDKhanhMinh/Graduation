"use client"

import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

type PosterMediaProps = {
  src: string | null
  alt: string
  fit: "contain" | "cover"
  position: "center" | "top" | "bottom"
  border: boolean
  shadow: boolean
  backgroundBlur: boolean
}

export function PosterMedia({ src, alt, fit, position, border, shadow, backgroundBlur }: PosterMediaProps) {
  const [failed, setFailed] = useState(false)
  const imageSrc = src && !failed ? src : ""
  const objectPosition = position === "top" ? "center top" : position === "bottom" ? "center bottom" : "center"

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,var(--event-secondary),transparent_45%),linear-gradient(135deg,var(--event-primary),var(--event-secondary))]",
        border && "border border-[var(--event-border)]",
        shadow && "shadow-2xl",
      )}
      data-poster-state={imageSrc ? "ready" : src ? "error" : "fallback"}
    >
      {imageSrc ? (
        <>
          {backgroundBlur ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl"
              style={{ backgroundImage: "url(" + imageSrc + ")" }}
            />
          ) : null}
          <Image
            src={imageSrc}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className={cn("relative", fit === "contain" ? "object-contain" : "object-cover")}
            style={{ objectPosition }}
            onError={() => setFailed(true)}
          />
        </>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" aria-hidden="true" />
      {!imageSrc ? (
        <div className="relative flex h-full min-h-64 items-end p-6 text-white sm:p-8">
          <div className="max-w-sm rounded-2xl border border-white/30 bg-black/20 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium">Lưu giữ những kỷ niệm thật đẹp.</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Thêm ảnh bìa Cloudinary trong phần cài đặt giao diện sự kiện khi có thể.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
