"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

import { track } from "@/lib/analytics/events"

export function PosterStudioAnalytics({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new MutationObserver(() => {
      if (root.textContent?.includes("PNG exported")) track("first_poster_completed", { source: "poster_studio_export" }, { dedupeKey: "poster-export" })
    })
    observer.observe(root, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [])
  return <div ref={rootRef}>{children}</div>
}
