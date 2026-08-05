import * as React from "react"

import { cn } from "@/lib/utils"

const statusClasses = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-primary/12 text-primary",
  memory: "bg-memory-pink/15 text-[color-mix(in_oklch,var(--memory-pink),black_35%)]",
  gold: "bg-memory-gold/20 text-[color-mix(in_oklch,var(--memory-gold),black_48%)]",
  info: "bg-status-info/15 text-status-info",
  success: "bg-status-success/15 text-status-success",
  warning: "bg-status-warning/15 text-status-warning",
  danger: "bg-status-danger/15 text-status-danger",
} as const

type StatusBadgeProps = React.ComponentProps<"span"> & {
  tone?: keyof typeof statusClasses
}

export function StatusBadge({
  className,
  tone = "neutral",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        statusClasses[tone],
        className
      )}
      {...props}
    />
  )
}