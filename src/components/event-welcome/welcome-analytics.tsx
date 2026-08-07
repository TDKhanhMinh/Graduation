"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

import { resolveWelcomeDeepLink } from "@/features/events/welcome"
import { trackWelcomeEvent, type WelcomeVisit } from "@/lib/analytics/events"
import type { WelcomeEventStatus } from "@/features/events/welcome"

type WelcomeAnalyticsProps = {
  slug: string
  status: WelcomeEventStatus
  children: ReactNode
}

function getAnalyticsVisit(slug: string): WelcomeVisit {
  const key = `memoria:welcome:visit:${slug}`
  try {
    const visit = window.sessionStorage.getItem(key) ? "repeat" : "first"
    window.sessionStorage.setItem(key, "1")
    return visit
  } catch {
    return "storage-unavailable"
  }
}

export function WelcomeAnalytics({ slug, status, children }: WelcomeAnalyticsProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const visit = getAnalyticsVisit(slug)
    const deepLink = resolveWelcomeDeepLink({
      search: window.location.search,
      hash: window.location.hash,
    })
    trackWelcomeEvent(
      "event_welcome_viewed",
      { slug, status, visit, deep_link_skipped: deepLink.target !== null },
      slug,
      { dedupeKey: "view" },
    )
    if (deepLink.target) {
      trackWelcomeEvent(
        "event_welcome_deep_link_skipped",
        { slug, action: deepLink.action ?? "unknown" },
        slug,
        { dedupeKey: deepLink.action ?? "hash" },
      )
    }

    let scrolled = false
    const onScroll = () => {
      if (scrolled || window.scrollY < 64) return
      scrolled = true
      trackWelcomeEvent("event_welcome_scrolled", { slug, status, depth: "hero-exited" }, slug, { dedupeKey: "scroll" })
    }
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const action = target?.closest<HTMLElement>("[data-welcome-action]")?.dataset.welcomeAction
      if (action === "submit-wish") {
        trackWelcomeEvent("event_welcome_submit_clicked", { slug, status, target: "wish" }, slug, { dedupeKey: "submit" })
      }
      if (action === "explore") {
        trackWelcomeEvent("event_welcome_explore_clicked", { slug, status, target: "gallery" }, slug, { dedupeKey: "explore" })
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    root.addEventListener("click", onClick)
    return () => {
      window.removeEventListener("scroll", onScroll)
      root.removeEventListener("click", onClick)
    }
  }, [slug, status])

  return <div ref={rootRef} className="contents" data-welcome-analytics={slug}>{children}</div>
}