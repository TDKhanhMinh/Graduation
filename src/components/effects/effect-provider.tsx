"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { getEffectConfig, type EffectIntensity, type EffectPreset, type EventEffectConfig } from "./effect-config"
import { type EffectQualityBudget, useEffectQuality } from "./effect-quality-manager"

export type EffectQuality = "auto" | "low" | "medium" | "high"

export type EffectState = {
  config: EventEffectConfig
  quality: "low" | "medium" | "high"
  qualityMode: EffectQuality
  qualityBudget: EffectQualityBudget
  reducedMotion: boolean
  isVisible: boolean
  isFullscreen: boolean
  setPreset: (preset: EffectPreset) => void
  setIntensity: (intensity: EffectIntensity) => void
  setQuality: (quality: EffectQuality) => void
}

const EffectStateContext = createContext<EffectState | null>(null)

export function EffectProvider({
  children,
  preset = "minimal",
  intensity = "low",
  quality = "auto",
}: {
  children: ReactNode
  preset?: EffectPreset
  intensity?: EffectIntensity
  quality?: EffectQuality
}) {
  const [currentPreset, setPreset] = useState<EffectPreset>(preset)
  const [currentIntensity, setIntensity] = useState<EffectIntensity>(intensity)
  const [currentQuality, setQuality] = useState<EffectQuality>(quality)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { effectiveQuality, budget } = useEffectQuality(currentQuality, reducedMotion, isVisible)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches)
    const updateVisibility = () => setIsVisible(document.visibilityState !== "hidden")
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))

    updateMotionPreference()
    updateVisibility()
    updateFullscreen()
    mediaQuery.addEventListener("change", updateMotionPreference)
    document.addEventListener("visibilitychange", updateVisibility)
    document.addEventListener("fullscreenchange", updateFullscreen)

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference)
      document.removeEventListener("visibilitychange", updateVisibility)
      document.removeEventListener("fullscreenchange", updateFullscreen)
    }
  }, [])

  const state = useMemo<EffectState>(() => ({
    config: getEffectConfig(currentPreset, currentIntensity),
    quality: effectiveQuality,
    qualityMode: currentQuality,
    qualityBudget: budget,
    reducedMotion,
    isVisible,
    isFullscreen,
    setPreset,
    setIntensity,
    setQuality,
  }), [budget, currentIntensity, currentPreset, currentQuality, effectiveQuality, isFullscreen, isVisible, reducedMotion])

  return <EffectStateContext.Provider value={state}>{children}</EffectStateContext.Provider>
}

export function useEffectState() {
  const state = useContext(EffectStateContext)
  if (!state) {
    throw new Error("useEffectState must be used inside an EffectProvider")
  }
  return state
}

export function useOptionalEffectState() {
  return useContext(EffectStateContext)
}
