"use client"

import { useCallback, useEffect, useState } from "react"
import { getTourSessionKey } from "./types"

export type TourLifecycleStage = 
  | "checking"   // Hydrating from localStorage
  | "idle"       // Waiting for conditions
  | "not-seen"   // Ready but prompt hasn't been shown yet
  | "ready"      // Showing prompt to start or skip
  | "running"    // Tour is active
  | "completed"  // Tour reached the end
  | "dismissed"  // Tour was skipped

export type UseGuidedTourOptions = {
  tourId: string
  version?: string
  ready?: boolean
  autoPrompt?: boolean
}

export function useGuidedTour({ 
  tourId, 
  version = "v1",
  ready = true,
  autoPrompt = true
}: UseGuidedTourOptions) {
  // Initialize state synchronously based on available props
  const [stage, setStage] = useState<TourLifecycleStage>(() => {
    // We can't access localStorage in SSR safely, but if window exists we can hydrate
    if (typeof window !== "undefined") {
      try {
        const key = getTourSessionKey(tourId, version)
        const stored = window.localStorage.getItem(key)
        if (stored === "completed") return "completed"
        if (stored === "dismissed" || stored === "skipped") return "dismissed"
      } catch {}
    }
    
    return "idle"
  })

  // Watch for readiness
  useEffect(() => {
    if (stage === "idle" && ready) {
      if (autoPrompt) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStage("ready")
      } else {
        setStage("not-seen")
      }
    }
  }, [stage, ready, autoPrompt])

  // Replay event listener
  useEffect(() => {
    const handleStart = () => {
      setStage("running")
    }
    window.addEventListener("guided-tour:start", handleStart)
    return () => window.removeEventListener("guided-tour:start", handleStart)
  }, [])

  const startTour = useCallback(() => {
    // allow force replay
    if (stage === "ready" || stage === "completed" || stage === "dismissed" || stage === "not-seen" || stage === "idle") {
      setStage("running")
    }
  }, [stage])

  const skipTour = useCallback(() => {
    setStage("dismissed")
    try {
      const key = getTourSessionKey(tourId, version)
      window.localStorage.setItem(key, "dismissed")
    } catch {
      // Ignore quota/security errors
    }
  }, [tourId, version])

  const completeTour = useCallback(() => {
    setStage("completed")
    try {
      const key = getTourSessionKey(tourId, version)
      window.localStorage.setItem(key, "completed")
    } catch {
      // Ignore quota/security errors
    }
  }, [tourId, version])

  const resetTour = useCallback(() => {
    try {
      const key = getTourSessionKey(tourId, version)
      window.localStorage.removeItem(key)
    } catch {
      // Ignore quota/security errors
    }
    setStage("idle")
  }, [tourId, version])

  return {
    stage,
    startTour,
    skipTour,
    completeTour,
    resetTour
  }
}
