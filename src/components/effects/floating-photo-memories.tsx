import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

const MEMORY_CARDS = [
  { className: "floating-memory-one", label: "Memory 01", tone: "linear-gradient(145deg,#fbcfe8,#f9a8d4)" },
  { className: "floating-memory-two", label: "Memory 02", tone: "linear-gradient(145deg,#fed7aa,#fde68a)" },
  { className: "floating-memory-three", label: "Memory 03", tone: "linear-gradient(145deg,#c4b5fd,#a5b4fc)" },
  { className: "floating-memory-four", label: "Memory 04", tone: "linear-gradient(145deg,#bae6fd,#a7f3d0)" },
  { className: "floating-memory-five", label: "Memory 05", tone: "linear-gradient(145deg,#ddd6fe,#fbcfe8)" },
] as const

export function FloatingPhotoMemories({
  className,
  featuredImage,
}: {
  className?: string
  featuredImage?: string | null
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 hidden overflow-hidden sm:block", className)}>
      {MEMORY_CARDS.map((card, index) => {
        const backgroundImage = featuredImage
          ? `linear-gradient(145deg, rgba(255,255,255,0.18), rgba(49,46,129,0.26)), url(${featuredImage})`
          : card.tone

        return (
          <div
            key={card.label}
            className={cn("floating-memory-card absolute w-24 rounded-xl border-4 border-white/80 p-1.5 shadow-xl", card.className)}
            style={{ "--memory-background": backgroundImage, "--memory-delay": `${index * -0.9}s` } as CSSProperties}
          >
            <div className="aspect-[4/5] rounded-md bg-[image:var(--memory-background)] bg-cover bg-center" />
            <span className="mt-1 block text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-700/70">{card.label}</span>
          </div>
        )
      })}
    </div>
  )
}
