import { cn } from "@/lib/utils"

export function ReducedMotionFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,var(--memory-peach),transparent_42%),radial-gradient(circle_at_20%_80%,var(--brand-100),transparent_46%)] opacity-40",
        className,
      )}
    />
  )
}
