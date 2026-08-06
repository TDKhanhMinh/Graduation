"use client"

import Image from "next/image"
import { useState } from "react"

type PosterMediaProps = {
  src: string | null
  alt: string
}

export function PosterMedia({ src, alt }: PosterMediaProps) {
  const [failed, setFailed] = useState(false)
  const imageSrc = src && !failed ? src : ""

  return (
    <div
      className="relative min-h-72 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,var(--event-secondary),transparent_45%),linear-gradient(135deg,var(--event-primary),var(--event-secondary))] sm:min-h-96 lg:min-h-full"
      data-poster-state={imageSrc ? "ready" : src ? "error" : "fallback"}
    >
      {imageSrc ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <Image
            src={imageSrc}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="relative object-contain sm:object-cover"
            onError={() => setFailed(true)}
          />
        </>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" aria-hidden="true" />
      {!imageSrc ? (
        <div className="relative flex h-full min-h-72 items-end p-6 text-white sm:min-h-96 sm:p-10">
          <div className="max-w-sm rounded-2xl border border-white/30 bg-black/20 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium">Your memories, beautifully kept.</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Add a Cloudinary cover in event appearance settings when available.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
