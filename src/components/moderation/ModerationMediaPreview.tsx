"use client"

import Image from "next/image"
import { AlertCircle, LoaderCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { createClient } from "@/lib/supabase/client"

type MediaProps = {
  media: {
    storage_path: string
    media_type: "image" | "audio"
    mime_type: string
  }
}

export function ModerationMediaPreview({ media }: MediaProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [resolvedPath, setResolvedPath] = useState<string | null>(null)
  const [errorPath, setErrorPath] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let active = true
    void supabase.storage.from("event-media-private").createSignedUrl(media.storage_path, 3600).then(({ data, error }) => {
      if (!active) return
      if (error || !data?.signedUrl) {
        console.error("Failed to load signed URL", error)
        setErrorPath(media.storage_path)
      } else {
        setUrl(data.signedUrl)
        setResolvedPath(media.storage_path)
        setErrorPath(null)
      }
    })

    return () => {
      active = false
    }
  }, [media.storage_path, supabase])

  const isError = errorPath === media.storage_path
  const isReady = resolvedPath === media.storage_path && Boolean(url)

  if (isError) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger" role="alert">
        <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        Không thể xem media hoặc bạn không có quyền truy cập.
      </div>
    )
  }

  if (!isReady || !url) {
    return <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-3 animate-spin" />Đang tải preview an toàn…</div>
  }

  if (media.media_type === "image") {
    return (
      <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg bg-surface-sunken">
        <Image src={url} alt="Xem trước media riêng tư" fill sizes="320px" className="object-contain" onError={() => setErrorPath(media.storage_path)} />
      </div>
    )
  }

  return (
    <div className="mt-2 w-full max-w-xs rounded-lg border bg-surface-sunken p-2">
      <audio src={url} controls className="h-10 w-full" preload="none" aria-label="Nghe preview audio riêng tư" onError={() => setErrorPath(media.storage_path)} />
    </div>
  )
}