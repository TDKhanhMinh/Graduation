"use client"

import { useEffect, useRef } from "react"
import { StickerController } from "./StickerController"

import { StickerInteractionManager } from "./StickerInteractionManager"
import { StickerParticleSystem } from "./sticker-physics"
import { StickerRenderer } from "./StickerRenderer"
import type { StickerPerformanceOptions, StickerSnapshot } from "./types"

export interface StickerCanvasProps {
  controller: StickerController
  exclusionSelectors?: string[]
  performanceOptions?: Partial<StickerPerformanceOptions>
  onSnapshotsUpdate?: (snapshots: StickerSnapshot[]) => void
}

export function StickerCanvas({
  controller,
  exclusionSelectors = [],
  performanceOptions,
  onSnapshotsUpdate,
}: StickerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    // Accessibility check: prefers-reduced-motion
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const effectiveOptions: Partial<StickerPerformanceOptions> = {
      ...performanceOptions,
      lowPowerMode: isReducedMotion || performanceOptions?.lowPowerMode || false,
    }

    const renderer = new StickerRenderer()
    const particleSystem = new StickerParticleSystem(effectiveOptions?.maxParticles || 60)
    const interactionManager = new StickerInteractionManager(controller)

    let animationFrame = 0
    let lastTime = performance.now()
    let elapsedSeconds = 0

    // Initialize controller image assets
    controller.initialize(effectiveOptions)
    interactionManager.attach(container)

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(bounds.width * dpr)
      canvas.height = Math.floor(bounds.height * dpr)
      const context = canvas.getContext("2d")
      if (context) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    const renderLoop = (time: number) => {
      if (document.visibilityState === "hidden") {
        animationFrame = requestAnimationFrame(renderLoop)
        return
      }

      const rawDelta = (time - lastTime) / 1000
      const deltaTime = Math.min(rawDelta, 0.05)
      lastTime = time
      elapsedSeconds += deltaTime

      const bounds = container.getBoundingClientRect()
      const isMobile = bounds.width < 640

      // Update controller & physics
      controller.update(
        deltaTime,
        elapsedSeconds,
        { width: bounds.width, height: bounds.height },
        interactionManager.pointerPos,
        isMobile,
        exclusionSelectors,
        (x, y, type, count) => {
          particleSystem.spawn(x, y, type, count)
        },
      )

      particleSystem.update(deltaTime)

      // Draw scene
      const context = canvas.getContext("2d")
      if (context) {
        renderer.clear(context, bounds.width, bounds.height)
        renderer.renderScene(
          context,
          Array.from(controller.characters.values()),
          particleSystem,
        )
      }

      // Notify DOM overlay of snapshots
      if (onSnapshotsUpdate) {
        const snapshots = Array.from(controller.characters.values()).map((c) =>
          c.getSnapshot(),
        )
        onSnapshotsUpdate(snapshots)
      }

      animationFrame = requestAnimationFrame(renderLoop)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    animationFrame = requestAnimationFrame(renderLoop)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      interactionManager.detach()
      particleSystem.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, JSON.stringify(exclusionSelectors), JSON.stringify(performanceOptions), onSnapshotsUpdate])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <canvas ref={canvasRef} className="size-full pointer-events-none" />
    </div>
  )
}
