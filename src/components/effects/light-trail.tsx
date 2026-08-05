"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"

import { CanvasSurface } from "./canvas-surface"

type TrailPoint = { age: number; x: number; y: number }

function subscribeMediaQuery(query: string, callback: () => void) {
  const mediaQuery = window.matchMedia(query)
  mediaQuery.addEventListener("change", callback)
  return () => mediaQuery.removeEventListener("change", callback)
}

function getMediaQuerySnapshot(query: string) {
  return () => window.matchMedia(query).matches
}

export function LightTrail({ className }: { className?: string }) {
  const pointsRef = useRef<TrailPoint[]>([])
  const finePointer = useSyncExternalStore(
    (callback) => subscribeMediaQuery("(pointer: fine)", callback),
    getMediaQuerySnapshot("(pointer: fine)"),
    () => false,
  )
  const reducedMotion = useSyncExternalStore(
    (callback) => subscribeMediaQuery("(prefers-reduced-motion: reduce)", callback),
    getMediaQuerySnapshot("(prefers-reduced-motion: reduce)"),
    () => false,
  )
  const enabled = finePointer && !reducedMotion

  useEffect(() => {
    if (!enabled) return

    const handlePointerMove = (event: PointerEvent) => {
      pointsRef.current = [
        ...pointsRef.current.slice(-10),
        { age: 0, x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight },
      ]
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    return () => window.removeEventListener("pointermove", handlePointerMove)
  }, [enabled])
  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 hidden lg:block ${className ?? ""}`}
    >
      <CanvasSurface
        draw={(context, size, _elapsed, delta) => {
          const nextPoints = pointsRef.current
            .map((point) => ({ ...point, age: point.age + delta }))
            .filter((point) => point.age < 0.7)
          pointsRef.current = nextPoints

          if (nextPoints.length < 2) return

          context.beginPath()
          nextPoints.forEach((point, index) => {
            const x = point.x * size.width
            const y = point.y * size.height
            if (index === 0) context.moveTo(x, y)
            else context.lineTo(x, y)
          })
          context.strokeStyle = "rgba(251, 207, 232, 0.42)"
          context.lineWidth = 2
          context.shadowBlur = 16
          context.shadowColor = "rgba(217, 70, 239, 0.34)"
          context.stroke()
        }}
      />
    </div>
  )
}
