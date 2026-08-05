import { Sparkle } from "lucide-react"

import { cn } from "@/lib/utils"

export function SparkleDecoration({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <Sparkle className="absolute size-4 text-memory-pink/60" />
      <Sparkle className="absolute left-8 top-7 size-2.5 text-memory-gold/70" />
      <span className="absolute left-3 top-12 size-2 rounded-full bg-memory-peach/60" />
    </div>
  )
}
