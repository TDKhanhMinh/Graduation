"use client"

import { useEffect } from "react"
import { CanvasSurface } from "./canvas-surface"

type ConfettiParticle = {
  color: string
  rotation: number
  spin: number
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
}

const COLORS = ["#f9a8d4", "#fcd34d", "#c4b5fd", "#93c5fd", "#fdba74"]

function createParticles(count = 48): ConfettiParticle[] {
  return Array.from({ length: count }, (_, index) => ({
    color: COLORS[index % COLORS.length],
    rotation: (index * 37) % 360,
    spin: (index % 2 === 0 ? 1 : -1) * (2 + (index % 4)),
    x: 0.18 + ((index * 17) % 64) / 100,
    y: -0.08 - (index % 5) * 0.035,
    vx: -0.16 + ((index * 13) % 32) / 100,
    vy: 0.18 + (index % 6) * 0.035,
    width: 5 + (index % 4),
    height: 9 + (index % 5),
  }))
}

export type CelebrationConfettiProps = {
  active: boolean
  triggerKey?: number | string
  reducedMotion?: boolean
  onComplete?: () => void
}

export function CelebrationConfetti({
  active,
  triggerKey,
  reducedMotion = false,
  onComplete,
}: CelebrationConfettiProps) {
  useEffect(() => {
    if (!active || !onComplete) return
    const timer = window.setTimeout(() => {
      onComplete()
    }, 1650)
    return () => window.clearTimeout(timer)
  }, [active, triggerKey, onComplete])

  if (!active) return null

  const particleCount = reducedMotion ? 12 : 48
  const particles = createParticles(particleCount)
  const surfaceKey = triggerKey !== undefined ? `confetti-${triggerKey}` : "confetti-burst"

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <CanvasSurface
        key={surfaceKey}
        duration={1.65}
        draw={(context, size, elapsed) => {
          const progress = Math.min(elapsed / 1.6, 1.2)

          for (const particle of particles) {
            const x = (particle.x + particle.vx * progress) * size.width
            const y = (particle.y + particle.vy * progress + 0.2 * progress * progress) * size.height
            if (y < -20 || y > size.height + 20) continue

            context.save()
            context.translate(x, y)
            context.rotate((particle.rotation + particle.spin * progress * 30) * (Math.PI / 180))
            context.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.72) / 0.48)
            context.fillStyle = particle.color
            context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height)
            context.restore()
          }
        }}
        fallback={<span className="absolute left-1/2 top-1/3 text-2xl text-memory-gold">✦</span>}
      />
    </div>
  )
}