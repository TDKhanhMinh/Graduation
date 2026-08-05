"use client"

import { useEffect, useMemo, useState } from "react"

import { CanvasSurface } from "./canvas-surface"
import { getEffectConfig, getParticleCount, type EffectIntensity, type EffectPreset } from "./effect-config"

type Particle = {
  alpha: number
  drift: number
  phase: number
  radius: number
  speed: number
  x: number
  y: number
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.17 + salt * 17.31) * 43758.5453
  return value - Math.floor(value)
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    alpha: 0.18 + seeded(index, 1) * 0.42,
    drift: 3 + seeded(index, 2) * 10,
    phase: seeded(index, 3) * Math.PI * 2,
    radius: 1 + seeded(index, 4) * 2.5,
    speed: 0.08 + seeded(index, 5) * 0.18,
    x: seeded(index, 6),
    y: seeded(index, 7),
  }))
}

export function AmbientParticles({
  className,
  intensity = "low",
  preset = "minimal",
}: {
  className?: string
  intensity?: EffectIntensity
  preset?: EffectPreset
}) {
  const [viewportWidth, setViewportWidth] = useState(1024)
  const config = getEffectConfig(preset, intensity)
  const particleCount = getParticleCount(config.intensity, viewportWidth)
  const particles = useMemo(() => createParticles(particleCount), [particleCount])

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth)
    updateWidth()
    window.addEventListener("resize", updateWidth, { passive: true })
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  return (
    <CanvasSurface
      className={className}
      enabled={config.particles && particleCount > 0}
      draw={(context, size, elapsed) => {
        for (const particle of particles) {
          const drift = Math.sin(elapsed * particle.speed + particle.phase) * particle.drift
          const x = particle.x * size.width + drift
          const y = ((particle.y * size.height - elapsed * particle.speed * 5) % size.height + size.height) % size.height
          const sparkle = Math.sin(elapsed * 0.7 + particle.phase) > 0.88

          context.beginPath()
          context.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`
          context.arc(x, y, sparkle ? particle.radius * 1.7 : particle.radius, 0, Math.PI * 2)
          context.fill()

          if (sparkle) {
            context.strokeStyle = `rgba(255, 255, 255, ${particle.alpha * 0.55})`
            context.lineWidth = 0.7
            context.beginPath()
            context.moveTo(x - 4, y)
            context.lineTo(x + 4, y)
            context.moveTo(x, y - 4)
            context.lineTo(x, y + 4)
            context.stroke()
          }
        }
      }}
    />
  )
}
