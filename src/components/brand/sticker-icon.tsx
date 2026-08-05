import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type StickerTone = "pink" | "peach" | "gold" | "violet"
type StickerDelay = "none" | "short" | "long"

const toneClasses: Record<StickerTone, string> = {
  pink: "bg-memory-pink/90 text-rose-700",
  peach: "bg-memory-peach/90 text-orange-700",
  gold: "bg-memory-gold/90 text-amber-800",
  violet: "bg-brand-100/95 text-brand-700",
}

const delayClasses: Record<StickerDelay, string> = {
  none: "",
  short: "sticker-float-delay-short",
  long: "sticker-float-delay-long",
}

type StickerIconProps = {
  Icon: LucideIcon
  className?: string
  delay?: StickerDelay
  tone?: StickerTone
}

export function StickerIcon({
  Icon,
  className,
  delay = "none",
  tone = "violet",
}: StickerIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "sticker-float pointer-events-none absolute z-20 grid size-12 place-items-center rounded-2xl border-2 border-white/80 shadow-lg shadow-brand-900/10",
        toneClasses[tone],
        delayClasses[delay],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={2.2} />
    </span>
  )
}
