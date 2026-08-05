"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { EFFECT_PERFORMANCE_BUDGET } from "./effect-config"
import { ReducedMotionFallback } from "./reduced-motion-fallback"

export type CanvasDraw = (
  context: CanvasRenderingContext2D,
  size: { width: number; height: number; pixelRatio: number },
  elapsed: number,
  delta: number,
) => void

type CanvasSurfaceProps = {
  className?: string
  draw: CanvasDraw
  enabled?: boolean
  fallback?: ReactNode
  paused?: boolean
  duration?: number
}

export function CanvasSurface({
  className,
  draw,
  enabled = true,
  fallback,
  paused = false,
  duration,
}: CanvasSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)
    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !enabled || paused || prefersReducedMotion) return

    const context = canvas.getContext("2d")
    if (!context) return

    let animationFrame = 0
    let isVisible = true
    let lastTime = 0
    let elapsed = 0
    let width = 0
    let height = 0
    let pixelRatio = 1

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, EFFECT_PERFORMANCE_BUDGET.maxDevicePixelRatio)
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const render = (time: number) => {
      if (!isVisible || document.visibilityState === "hidden") {
        animationFrame = 0
        return
      }

      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0
      lastTime = time
      elapsed += delta
      context.clearRect(0, 0, width, height)
      drawRef.current(context, { width, height, pixelRatio }, elapsed, delta)
      if (duration !== undefined && elapsed >= duration) {
        animationFrame = 0
        return
      }
      animationFrame = requestAnimationFrame(render)
    }

    const setVisibility = (visible: boolean) => {
      isVisible = visible
      if (isVisible && !animationFrame) {
        lastTime = 0
        animationFrame = requestAnimationFrame(render)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisibility(Boolean(entry?.isIntersecting)),
      { threshold: 0 },
    )
    const resizeObserver = new ResizeObserver(resize)
    const handleVisibilityChange = () => setVisibility(document.visibilityState !== "hidden")

    resize()
    observer.observe(canvas)
    resizeObserver.observe(canvas)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    setVisibility(true)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [duration, enabled, paused, prefersReducedMotion])

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="size-full" />
      {prefersReducedMotion ? fallback ?? <ReducedMotionFallback /> : null}
    </div>
  )
}
