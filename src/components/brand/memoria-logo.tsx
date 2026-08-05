"use client"

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

type MemoriaLogoProps = {
  className?: string
  compact?: boolean
}

export function MemoriaLogo({ className, compact = false }: MemoriaLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20"
      >
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-memory-peach ring-2 ring-background" />
        <Sparkles className="size-4" />
      </span>
      {!compact ? (
        <span className="font-heading text-base font-semibold tracking-tight text-foreground">
          Memoria
        </span>
      ) : null}
    </span>
  )
}
