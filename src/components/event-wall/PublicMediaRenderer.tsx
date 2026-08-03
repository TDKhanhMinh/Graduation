  "use client"

import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { useEffect, useState } from "react"

type MediaProps = {
  media: {
    path: string
    type: 'image' | 'audio'
    mime_type: string
  }
}

export function PublicMediaRenderer({ media }: MediaProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let active = true
    async function loadUrl() {
      // Create signed URL valid for 2 hours
      const { data, error } = await supabase
        .storage
        .from('event-media-private')
        .createSignedUrl(media.path, 7200)

      if (error || !data) {
        console.error("Failed to load media URL", error)
        if (active) setError(true)
      } else {
        if (active) setUrl(data.signedUrl)
      }
    }
    loadUrl()
    return () => { active = false }
  }, [media.path, supabase])

  if (error) return <div className="text-sm text-red-500 italic p-2 border rounded-md">Failed to load media</div>
  if (!url) return <div className="animate-pulse bg-muted rounded-md h-32 w-full mt-2" />

  if (media.type === 'image') {
    return (
      <div className="relative mt-2 w-full pt-[56.25%] rounded-md overflow-hidden bg-muted">
        <Image 
          src={url} 
          alt="User uploaded media" 
          fill 
          className="object-contain"
        />
      </div>
    )
  }

  if (media.type === 'audio') {
    return (
      <div className="mt-2 w-full bg-muted/30 p-2 rounded-md">
        <audio src={url} controls className="h-10 w-full" preload="none" />
      </div>
    )
  }

  return null
}
