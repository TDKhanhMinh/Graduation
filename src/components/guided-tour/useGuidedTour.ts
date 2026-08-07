"use client"

import { useCallback, useEffect, useState } from "react"
import { getTourSessionKey } from "./types"

export type TourLifecycleStage = 
  | "checking"   // Hydrating from localStorage
  | "idle"       // Waiting for conditions (e.g. splash to close)
  | "ready"      // Showing prompt to start or skip
  | "running"    // Tour is active
  | "completed"  // Tour reached the end
  | "skipped"    // Tour was skipped

export type UseGuidedTourOptions = {
  slug: string
  version?: string
  splashStage: string // e.g. "checking", "intro", "open", "closed"
  deepLinkSkipIntro?: boolean
  eventStatus?: "archived" | "upcoming" | "live" | "closed"
}

export function useGuidedTour({ 
  slug, 
  version = "v1",
  splashStage,
  deepLinkSkipIntro = false,
  eventStatus = "upcoming"
}: UseGuidedTourOptions) {
  // Initialize state synchronously based on available props
  const [stage, setStage] = useState<TourLifecycleStage>(() => {
    if (eventStatus === "archived" || eventStatus === "closed" || deepLinkSkipIntro) {
      return "skipped"
    }
    
    // We can't access localStorage in SSR safely, but if window exists we can hydrate
    if (typeof window !== "undefined") {
      try {
        const key = getTourSessionKey(slug, version)
        const stored = window.localStorage.getItem(key)
        if (stored === "completed") return "completed"
        if (stored === "skipped") return "skipped"
      } catch {}
    }
    
    return "idle"
  })

  // Watch for splash stage to close, then prompt if idle
  // We use an effect here but only to transition from idle to ready
  useEffect(() => {
    if (stage === "idle" && splashStage === "closed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage("ready")
    }
  }, [stage, splashStage])

  // Replay event listener
  useEffect(() => {
    const handleStart = () => {
      setStage("running")
    }
    window.addEventListener("guided-tour:start", handleStart)
    return () => window.removeEventListener("guided-tour:start", handleStart)
  }, [])

  const startTour = useCallback(() => {
    if (stage === "ready" || stage === "completed" || stage === "skipped") {
      setStage("running")
    }
  }, [stage])

  const skipTour = useCallback(() => {
    setStage("skipped")
    try {
      const key = getTourSessionKey(slug, version)
      window.localStorage.setItem(key, "skipped")
    } catch {
      // Ignore quota/security errors
    }
  }, [slug, version])

  const completeTour = useCallback(() => {
    setStage("completed")
    try {
      const key = getTourSessionKey(slug, version)
      window.localStorage.setItem(key, "completed")
    } catch {
      // Ignore quota/security errors
    }
  }, [slug, version])

  const resetTour = useCallback(() => {
    try {
      const key = getTourSessionKey(slug, version)
      window.localStorage.removeItem(key)
    } catch {
      // Ignore quota/security errors
    }
    setStage("idle")
  }, [slug, version])

  return {
    stage,
    startTour,
    skipTour,
    completeTour,
    resetTour
  }
}
