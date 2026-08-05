import { cn } from "@/lib/utils"

export function FilmGrainOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("film-grain-overlay pointer-events-none absolute inset-0 z-10", className)}
    />
  )
}
