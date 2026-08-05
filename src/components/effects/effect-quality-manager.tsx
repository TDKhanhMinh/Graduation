"use client"

import { useEffect, useMemo, useState } from "react"

import type { EffectQuality } from "./effect-provider"

export type QualitySignals = {
  hardwareConcurrency: number
  devicePixelRatio: number
  fps?: number
  isVisible: boolean
  reducedMotion: boolean
}

export type EffectQualityBudget = {
  particleMultiplier: number
  maxPixelRatio: number
  maxBlurPixels: number
  maxCanvasLoops: number
  animationsEnabled: boolean
}

const QUALITY_BUDGETS: Record<"low" | "medium" | "high", EffectQualityBudget> = {
  low: {
    particleMultiplier: 0.5,
    maxPixelRatio: 1,
    maxBlurPixels: 8,
    maxCanvasLoops: 1,
    animationsEnabled: true,
  },
  medium: {
    particleMultiplier: 0.8,
    maxPixelRatio: 1.25,
    maxBlurPixels: 16,
    maxCanvasLoops: 1,
    animationsEnabled: true,
  },
  high: {
    particleMultiplier: 1,
    maxPixelRatio: 1.5,
    maxBlurPixels: 24,
    maxCanvasLoops: 1,
    animationsEnabled: true,
  },
}

export function resolveEffectQuality(
  quality: EffectQuality,
  signals: QualitySignals,
): "low" | "medium" | "high" {
  if (signals.reducedMotion || !signals.isVisible) return "low"
  if (quality !== "auto") return quality
  if (signals.hardwareConcurrency <= 2 || signals.devicePixelRatio > 2) return "low"
  if (signals.fps !== undefined && signals.fps < 30) return "low"
  if (signals.hardwareConcurrency >= 8 && signals.devicePixelRatio <= 1.5 && (signals.fps === undefined || signals.fps >= 50)) return "high"
  return "medium"
}

export function getEffectQualityBudget(
  quality: "low" | "medium" | "high",
  reducedMotion = false,
): EffectQualityBudget {
  const budget = QUALITY_BUDGETS[quality]
  return reducedMotion ? { ...budget, particleMultiplier: 0, animationsEnabled: false } : budget
}

function getInitialSignals(): QualitySignals {
  if (typeof window === "undefined") {
    return { hardwareConcurrency: 4, devicePixelRatio: 1, isVisible: true, reducedMotion: false }
  }

  return {
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    devicePixelRatio: window.devicePixelRatio || 1,
    isVisible: document.visibilityState !== "hidden",
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }
}

function useFpsSample(enabled: boolean) {
  const [fps, setFps] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled || typeof requestAnimationFrame !== "function") return

    let frameCount = 0
    let firstFrame = 0
    let animationFrame = 0

    const sample = (time: number) => {
      if (!firstFrame) firstFrame = time
      frameCount += 1
      if (frameCount >= 8) {
        const elapsed = time - firstFrame
        if (elapsed > 0) setFps(Math.round((frameCount - 1) * 1000 / elapsed))
        return
      }
      animationFrame = requestAnimationFrame(sample)
    }

    animationFrame = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(animationFrame)
  }, [enabled])

  return fps
}

export function useEffectQuality(
  quality: EffectQuality,
  reducedMotion: boolean,
  isVisible: boolean,
) {
  const signals = getInitialSignals()
  const fps = useFpsSample(quality === "auto" && isVisible && !reducedMotion)
  const effectiveQuality = resolveEffectQuality(quality, { ...signals, fps, isVisible, reducedMotion })
  const budget = useMemo(() => getEffectQualityBudget(effectiveQuality, reducedMotion), [effectiveQuality, reducedMotion])

  return { effectiveQuality, budget, fps }
}
