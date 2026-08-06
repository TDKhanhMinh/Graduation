"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { getWelcomeSessionKey, resolveWelcomeDeepLink } from "@/features/events/welcome"

type WelcomeVisit = "unknown" | "first" | "repeat" | "storage-unavailable"
type WelcomeMotion = "pending" | "running" | "paused" | "reduced" | "complete"

type WelcomeSessionProps = {
  slug: string
  children: ReactNode
}

function focusDeepLinkTarget(targetId: string, reducedMotion: boolean) {
  const target = document.getElementById(targetId)
  if (!target) return

  target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
  const focusTarget = target.querySelector<HTMLElement>(
    '[data-testid="open-composer"], button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])',
  )
  focusTarget?.focus({ preventScroll: true })
}

export function WelcomeSession({ slug, children }: WelcomeSessionProps) {
  const [visit, setVisit] = useState<WelcomeVisit>("unknown")
  const [deepLinkAction, setDeepLinkAction] = useState<string | null>(null)
  const [motion, setMotion] = useState<WelcomeMotion>("pending")

  useEffect(() => {
    let nextVisit: WelcomeVisit
    try {
      const key = getWelcomeSessionKey(slug)
      const isFirstVisit = !window.sessionStorage.getItem(key)
      if (isFirstVisit) window.sessionStorage.setItem(key, "1")
      nextVisit = isFirstVisit ? "first" : "repeat"
    } catch {
      nextVisit = "storage-unavailable"
    }

    const deepLink = resolveWelcomeDeepLink({
      search: window.location.search,
      hash: window.location.hash,
    })
    const motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let prefersReducedMotion = motionMediaQuery.matches
    let isInView = true
    let isPageVisible = document.visibilityState !== "hidden"
    const getMotionState = (): WelcomeMotion => {
      if (deepLink.target) return "complete"
      if (prefersReducedMotion) return "reduced"
      return isInView && isPageVisible ? "running" : "paused"
    }
    const updateMotionState = () => setMotion(getMotionState())
    const motionTimer = window.setTimeout(() => {
      setVisit(nextVisit)
      setDeepLinkAction(deepLink.action)
      setMotion(getMotionState())
    }, 0)

    const target = document.getElementById("welcome-hero")
    const observer = target && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          isInView = Boolean(entry?.isIntersecting)
          updateMotionState()
        }, { threshold: 0 })
      : null
    if (observer && target) observer.observe(target)

    const handleVisibilityChange = () => {
      isPageVisible = document.visibilityState !== "hidden"
      updateMotionState()
    }
    const handleMotionPreference = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches
      setMotion(getMotionState())
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    motionMediaQuery.addEventListener("change", handleMotionPreference)

    const focusTimer = deepLink.target
      ? window.setTimeout(() => focusDeepLinkTarget(deepLink.target!, prefersReducedMotion), 0)
      : null
    return () => {
      window.clearTimeout(motionTimer)
      if (focusTimer !== null) window.clearTimeout(focusTimer)
      observer?.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      motionMediaQuery.removeEventListener("change", handleMotionPreference)
    }
  }, [slug])

  return (
    <div
      className="contents"
      data-deep-link-action={deepLinkAction ?? undefined}
      data-welcome-motion={motion}
      data-welcome-visit={visit}
      data-welcome-session={slug}
    >
      {children}
    </div>
  )
}
