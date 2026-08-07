"use client"

import { useEffect } from "react"
import { CanvasSurface } from "./canvas-surface"

type ParticleType = "rect" | "circle" | "star"

type ConfettiParticle = {
  type: ParticleType
  color: string
  rotation: number
  spin: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  scale: number
  alpha: number
}

const COLORS = [
  "#fcd34d", // amber/gold
  "#f9a8d4", // rose/pink
  "#c4b5fd", // violet
  "#93c5fd", // sky blue
  "#6ee7b7", // emerald
  "#fdba74", // orange
  "#ffffff", // sparkling white
]

function createParticles(count = 90): ConfettiParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const isCenterBurst = index % 3 === 0
    const types: ParticleType[] = ["rect", "circle", "star", "rect"]

    if (isCenterBurst) {
      // 1. Burst 360deg outward from the invitation card center (x: 0.5, y: 0.45)
      const angle = (index * 23.4) % 360
      const rad = (angle * Math.PI) / 180
      const speed = 0.35 + (index % 7) * 0.07

      return {
        type: types[index % types.length],
        color: COLORS[index % COLORS.length],
        rotation: (index * 37) % 360,
        spin: (index % 2 === 0 ? 1 : -1) * (3 + (index % 5)),
        x: 0.5,
        y: 0.45,
        vx: Math.cos(rad) * speed * 0.7,
        vy: Math.sin(rad) * speed * 0.7 - 0.25, // Initial velocity outward & upward
        size: 7 + (index % 6),
        scale: 0.8 + (index % 4) * 0.2,
        alpha: 1,
      }
    }

    // 2. Bottom Side Cannons (bottom-left x: 0.12, bottom-right x: 0.88 shooting UPWARDS)
    const isLeftCannon = index % 2 === 0
    const startX = isLeftCannon ? 0.12 + (index % 5) * 0.02 : 0.88 - (index % 5) * 0.02
    const angle = isLeftCannon ? -70 + (index % 7) * 8 : -110 - (index % 7) * 8
    const speed = 0.75 + (index % 9) * 0.08
    const rad = (angle * Math.PI) / 180

    return {
      type: types[index % types.length],
      color: COLORS[index % COLORS.length],
      rotation: (index * 43) % 360,
      spin: (index % 2 === 0 ? 1 : -1) * (3 + (index % 5)),
      x: startX,
      y: 0.95, // Bottom of screen
      vx: Math.cos(rad) * speed * 0.6,
      vy: Math.sin(rad) * speed * 0.95, // Negative vy -> shoots UPWARDS into upper screen
      size: 7 + (index % 6),
      scale: 0.8 + (index % 4) * 0.2,
      alpha: 1,
    }
  })
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
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [active, triggerKey, onComplete])

  if (!active) return null

  const particleCount = reducedMotion ? 20 : 80
  const particles = createParticles(particleCount)
  const surfaceKey = triggerKey !== undefined ? `confetti-${triggerKey}` : "confetti-burst"

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <CanvasSurface
        key={surfaceKey}
        duration={2.2}
        draw={(context, size, elapsed) => {
          const progress = Math.min(elapsed / 2.0, 1.2)
          const gravity = 0.65

          for (const particle of particles) {
            // Physics trajectory
            const currentX = (particle.x + particle.vx * progress) * size.width
            const currentY =
              (particle.y + particle.vy * progress + 0.5 * gravity * progress * progress) * size.height

            if (currentY < -40 || currentY > size.height + 40) continue

            const alpha = Math.max(0, 1 - Math.max(0, progress - 0.65) / 0.45)
            if (alpha <= 0) continue

            context.save()
            context.translate(currentX, currentY)
            context.rotate((particle.rotation + particle.spin * progress * 40) * (Math.PI / 180))
            context.globalAlpha = alpha

            if (particle.type === "circle") {
              context.fillStyle = particle.color
              context.beginPath()
              context.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
              context.fill()
            } else if (particle.type === "star") {
              context.fillStyle = particle.color
              context.font = `${Math.round(particle.size * 1.8)}px sans-serif`
              context.textAlign = "center"
              context.textBaseline = "middle"
              context.fillText("✦", 0, 0)
            } else {
              context.fillStyle = particle.color
              context.fillRect(
                -particle.size / 2,
                (-particle.size * 1.5) / 2,
                particle.size,
                particle.size * 1.5,
              )
            }

            context.restore()
          }
        }}
        fallback={<span className="fixed left-1/2 top-1/3 z-[70] text-3xl text-amber-400 animate-bounce">✨ ✦ ✨</span>}
      />
    </div>
  )
}