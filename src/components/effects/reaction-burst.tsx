import type { CSSProperties } from "react"

const BURST_ANGLES = [-72, -36, 0, 36, 72]

export function ReactionBurst({
  emoji,
  trigger,
}: {
  emoji: string | null
  trigger: number
}) {
  if (!emoji || trigger === 0) return null

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {BURST_ANGLES.map((angle) => (
        <span
          key={`${trigger}-${angle}`}
          className="reaction-burst-particle absolute left-1/2 top-1/2 text-base"
          style={{ "--burst-angle": `${angle}deg` } as CSSProperties}
        >
          {emoji}
        </span>
      ))}
    </span>
  )
}
