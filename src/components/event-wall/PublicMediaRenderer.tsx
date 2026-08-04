"use client"

import Image from "next/image"
import { AlertCircle, LoaderCircle } from "lucide-react"
import { useEffect, useState } from "react"

type MediaProps = {
  wishId: string
  media: {
    path: string
    type: "image" | "audio"
    mime_type: string
  }
}

type Resolution = {
  key: string
  url: string | null
  error: boolean
}

export function PublicMediaRenderer({ wishId, media }: MediaProps) {
  const mediaKey = wishId + ":" + media.path
  const [resolution, setResolution] = useState<Resolution | null>(null)

  useEffect(() => {
    let active = true


    void fetch("/api/media/public-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, path: media.path, kind: "media" }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Media unavailable")
        const body = (await response.json()) as { signedUrl?: string }
        if (!body.signedUrl) throw new Error("Media unavailable")
        if (active) setResolution({ key: mediaKey, url: body.signedUrl, error: false })
      })
      .catch(() => {
        if (active) setResolution({ key: mediaKey, url: null, error: true })
      })

    return () => {
      active = false
    }
  }, [media.path, mediaKey, wishId])

  const currentResolution = resolution?.key === mediaKey ? resolution : null
  const url = currentResolution?.url ?? null
  const error = currentResolution?.error ?? false

  if (error) {
    return (
      <div
        className="mt-3 flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
        role="alert"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>Tệp đính kèm hiện không khả dụng.</span>
      </div>
    )
  }

  if (!url) {
    return (
      <div
        className="mt-3 flex h-32 items-center justify-center gap-2 rounded-lg border bg-surface-sunken text-sm text-muted-foreground"
        role="status"
        aria-label="Đang tải tệp đính kèm"
      >
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Đang tải tệp đính kèm…
      </div>
    )
  }

  if (media.type === "image") {
    return (
      <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-surface-sunken">
        <Image
          src={url}
          alt="Ảnh đính kèm lời chúc"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain"
          onError={() => setResolution({ key: mediaKey, url: null, error: true })}
        />
      </div>
    )
  }

  return (
    <div className="mt-3 w-full rounded-lg border bg-surface-sunken p-3">
      <audio
        src={url}
        controls
        className="h-10 w-full max-w-full"
        preload="none"
        aria-label="Bản ghi âm lời chúc"
        onError={() => setResolution({ key: mediaKey, url: null, error: true })}
      />
    </div>
  )
}