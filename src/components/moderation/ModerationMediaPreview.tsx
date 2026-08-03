"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

type MediaProps = {
  media: {
    storage_path: string
    media_type: 'image' | 'audio'
    mime_type: string
  }
}

export function ModerationMediaPreview({ media }: MediaProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let active = true
    async function loadUrl() {
      const { data, error } = await supabase
        .storage
        .from('event-media-private')
        .createSignedUrl(media.storage_path, 3600)

      if (error || !data) {
        console.error("Failed to load signed URL", error)
        if (active) setError(true)
      } else {
        if (active) setUrl(data.signedUrl)
      }
    }
    loadUrl()
    return () => { active = false }
  }, [media.storage_path, supabase])

  if (error) return <div className="text-sm text-red-500">Failed to load media</div>
  if (!url) return <div className="text-sm text-muted-foreground">Loading media...</div>

  if (media.media_type === 'image') {
    return (
      <div className="relative mt-2 w-24 h-24 rounded-md overflow-hidden bg-muted">
        <Image 
          src={url} 
          alt="Media preview" 
          fill 
          className="object-cover"
        />
      </div>
    )
  }

  if (media.media_type === 'audio') {
    return (
      <div className="mt-2 w-full max-w-[200px]">
        <audio src={url} controls className="h-8 w-full" preload="none" />
      </div>
    )
  }

  return null
}
