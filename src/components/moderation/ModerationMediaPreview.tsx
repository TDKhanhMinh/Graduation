"use client"

import Image from "next/image"
import { AlertCircle, LoaderCircle } from "lucide-react"
import { useState } from "react"

// Cloudinary media URLs are resolved directly; no storage client is used.

type MediaProps = {
  media: {
    storage_path: string
    media_type: "image" | "audio"
    mime_type: string
  }
}

export function ModerationMediaPreview({ media }: MediaProps) {
  const [hasError, setHasError] = useState(false)
  const setErrorPath = (path: string) => { void path; setHasError(true) }
  const isCloudinaryPath = /^https:\/\/res\.cloudinary\.com\//.test(media.storage_path)

  const url = isCloudinaryPath && !hasError ? media.storage_path : null

  const isError = !isCloudinaryPath || hasError
  const isReady = Boolean(url)

  if (isError) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger" role="alert">
        <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        Không thể xem tệp đa phương tiện hoặc bạn không có quyền truy cập.
      </div>
    )
  }

  if (!isReady || !url) {
    return <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-3 animate-spin" />Đang tải bản xem trước an toàn…</div>
  }

  if (media.media_type === "image") {
    return (
      <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-2xl border border-border/80 bg-surface-sunken">
        <Image src={url} alt="Xem trước tệp đa phương tiện riêng tư" fill sizes="320px" className="object-contain" onError={() => setErrorPath(media.storage_path)} />
      </div>
    )
  }

  return (
    <div className="mt-2 w-full max-w-xs rounded-2xl border border-border/80 bg-surface-sunken p-2">
      <audio src={url} controls className="h-10 w-full" preload="none" aria-label="Nghe trước tệp âm thanh riêng tư" onError={() => setErrorPath(media.storage_path)} />
    </div>
  )
}