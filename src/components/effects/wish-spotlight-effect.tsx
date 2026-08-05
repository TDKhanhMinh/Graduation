"use client"

import { CanvasSurface } from "./canvas-surface"

function hash(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0)
}

export function WishSpotlightEffect({ wishId }: { wishId: string | null }) {
  if (!wishId) return null

  const seed = hash(wishId)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      data-testid="wish-spotlight-effect"
    >
      <div className="wish-spotlight-wash absolute inset-0" />
      <CanvasSurface
        className="z-10"
        draw={(context, size, elapsed) => {
          const progress = Math.min(elapsed / 1.8, 1)
          const fade = 1 - progress
          const centerX = size.width * (0.42 + (seed % 17) / 100)
          const centerY = size.height * (0.32 + (seed % 11) / 100)
          const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size.width * 0.58)
          glow.addColorStop(0, `rgba(255, 255, 255, ${0.22 * fade})`)
          glow.addColorStop(0.55, `rgba(251, 207, 232, ${0.12 * fade})`)
          glow.addColorStop(1, "rgba(255, 255, 255, 0)")
          context.fillStyle = glow
          context.fillRect(0, 0, size.width, size.height)

          for (let index = 0; index < 18; index += 1) {
            const angle = (index / 18) * Math.PI * 2 + seed * 0.01
            const distance = progress * (22 + (index % 5) * 12)
            const x = centerX + Math.cos(angle) * distance
            const y = centerY + Math.sin(angle) * distance
            const radius = 1 + (index % 3) * 0.7

            context.beginPath()
            context.fillStyle = `rgba(255, 255, 255, ${0.72 * fade})`
            context.arc(x, y, radius, 0, Math.PI * 2)
            context.fill()
          }
        }}
      />
    </div>
  )
}
