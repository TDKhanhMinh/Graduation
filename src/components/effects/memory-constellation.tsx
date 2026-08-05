"use client"

import { useMemo } from "react"

import type { PublicWish } from "@/features/wishes/dal"

import { CanvasSurface } from "./canvas-surface"
import { useOptionalEffectState } from "./effect-provider"
import { getParticleCount, type EffectIntensity, type EffectPreset } from "./effect-config"

type ConstellationNode = {
  glow: number
  radius: number
  x: number
  y: number
}

export type ConstellationMode = "wall" | "waiting" | "summary"

function createNodes(wishes: PublicWish[], intensity: EffectIntensity, particleMultiplier = 1, mode: ConstellationMode = "wall"): ConstellationNode[] {
  const maxNodes = Math.min(Math.floor(getParticleCount(intensity, 1440, particleMultiplier)), mode === "waiting" ? 36 : 72)

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
  mode = "wall",
}: {
  className?: string
  intensity: EffectIntensity
  preset: EffectPreset
  wishes: PublicWish[]
  mode?: ConstellationMode
}) {
  const effectState = useOptionalEffectState()
  const nodes = useMemo(
    () => createNodes(wishes, intensity, effectState?.qualityBudget.particleMultiplier ?? 1, mode),
    [effectState?.qualityBudget.particleMultiplier, intensity, mode, wishes],
  )
  const accessibleWishes = wishes.slice(0, nodes.length || Math.min(wishes.length, 36))
  const isStatic = Boolean(effectState?.reducedMotion || effectState?.quality === "low")

  return (
    <div className="absolute inset-0" data-constellation-mode={mode} aria-label={mode === "waiting" ? "Memory Constellation waiting mode" : "Memory Constellation"}>
      <CanvasSurface
        className={className}
        enabled={!isStatic && intensity !== "off" && nodes.length > 0}
        fallback={null}
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
            context.fillStyle = constellationColor.replace("0.78", String(isStatic ? Math.min(node.glow, 0.65) : node.glow))
            context.shadowBlur = isStatic ? 0 : 10
            context.shadowColor = "rgba(251, 207, 232, 0.65)"
            context.arc(x, y, node.radius * (isStatic ? 1 : pulse), 0, Math.PI * 2)
            context.fill()
            context.shadowBlur = 0
          })
        }}
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
        {mode === "waiting" ? "Waiting for the next memory…" : mode === "summary" ? `${wishes.length} memories in this constellation` : "Memory constellation"}
      </div>
      <div className="sr-only" role="region" aria-label="Accessible memory constellation list">
        {accessibleWishes.length === 0 ? (
          <p>No approved memories are available yet. The constellation is waiting for the first wish.</p>
        ) : (
          <ul>
            {accessibleWishes.map((wish) => (
              <li key={wish.id}>
                <span>{wish.sender_name}: {wish.content || "Media memory"}</span>
                {wish.is_pinned ? <span> Pinned.</span> : null}
                {wish.media ? <span> Includes media.</span> : null}
                {wish.reactions?.length ? <span> Has reactions.</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
