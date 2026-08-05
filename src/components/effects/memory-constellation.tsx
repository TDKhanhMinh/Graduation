"use client"

import { useMemo } from "react"

import type { PublicWish } from "@/features/wishes/dal"

import { CanvasSurface } from "./canvas-surface"
import { getParticleCount, type EffectIntensity, type EffectPreset } from "./effect-config"

type ConstellationNode = {
  glow: number
  radius: number
  x: number
  y: number
}

function createNodes(wishes: PublicWish[], intensity: EffectIntensity): ConstellationNode[] {
  const maxNodes = Math.min(getParticleCount(intensity, 1440), 72)

  return wishes.slice(0, maxNodes).map((wish, index) => {
    const reactionCount = wish.reactions?.reduce((total, reaction) => total + reaction.count, 0) ?? 0
    const angle = index * 2.39996
    const distance = 0.12 + (index % 7) * 0.045

    return {
      glow: Math.min(1, 0.28 + (wish.is_pinned ? 0.35 : 0) + (wish.media ? 0.18 : 0) + Math.min(reactionCount, 8) * 0.025),
      radius: 1.6 + (wish.is_pinned ? 2 : 0) + (wish.media ? 0.8 : 0),
      x: 0.5 + Math.cos(angle) * distance,
      y: 0.5 + Math.sin(angle) * distance * 0.62,
    }
  })
}

function getConstellationColor(preset: EffectPreset): string {
  if (preset === "graduation" || preset === "celebration") return "rgba(253, 230, 138, 0.78)"
  if (preset === "romantic") return "rgba(251, 207, 232, 0.78)"
  if (preset === "galaxy") return "rgba(191, 219, 254, 0.78)"
  return "rgba(255, 255, 255, 0.78)"
}

export function MemoryConstellation({
  className,
  intensity,
  preset,
  wishes,
}: {
  className?: string
  intensity: EffectIntensity
  preset: EffectPreset
  wishes: PublicWish[]
}) {
  const nodes = useMemo(() => createNodes(wishes, intensity), [intensity, wishes])

  return (
    <CanvasSurface
      className={className}
      enabled={intensity !== "off" && nodes.length > 0}
      draw={(context, size, elapsed) => {
        const pulse = 1 + Math.sin(elapsed * 0.8) * 0.08
        const constellationColor = getConstellationColor(preset)

        nodes.forEach((node, index) => {
          const x = node.x * size.width
          const y = node.y * size.height
          const next = nodes[index + 1]

          if (next && index % 3 !== 2) {
            context.beginPath()
            context.moveTo(x, y)
            context.lineTo(next.x * size.width, next.y * size.height)
            context.strokeStyle = constellationColor.replace("0.78", "0.1")
            context.lineWidth = 0.7
            context.stroke()
          }

          context.beginPath()
          context.fillStyle = constellationColor.replace("0.78", String(node.glow))
          context.shadowBlur = 10
          context.shadowColor = "rgba(251, 207, 232, 0.65)"
          context.arc(x, y, node.radius * pulse, 0, Math.PI * 2)
          context.fill()
          context.shadowBlur = 0
        })
      }}
    />
  )
}
