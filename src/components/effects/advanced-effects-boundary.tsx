"use client"

import type { ComponentType, ReactNode } from "react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export type AdvancedEffectLoader = () => Promise<{ default: ComponentType }>

type AdvancedEffectsBoundaryProps = {
  className?: string
  enabled?: boolean
  fallback?: ReactNode
  load?: AdvancedEffectLoader
}

/**
 * Phase 3 extension point for 3D/pixel effects.
 *
 * Keep `load` undefined in MVP routes. An opt-in route can pass a memoized
 * loader backed by a dynamic import, so Three.js/PixiJS code is not included
 * in the default landing page or public wall bundle.
 */
export function AdvancedEffectsBoundary({
  className,
  enabled = false,
  fallback = null,
  load,
}: AdvancedEffectsBoundaryProps) {
  const [loadedEffect, setLoadedEffect] = useState<{ loader: AdvancedEffectLoader; component: ComponentType } | null>(null)

  useEffect(() => {
    if (!enabled || !load) return

    let cancelled = false
    void load().then((module) => {
      if (!cancelled) setLoadedEffect({ loader: load, component: module.default })
    })

    return () => {
      cancelled = true
    }
  }, [enabled, load])

  if (!enabled || !load) return null
  if (!loadedEffect || loadedEffect.loader !== load) return fallback ?? null
  const Effect = loadedEffect.component

  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <Effect />
    </div>
  )
}