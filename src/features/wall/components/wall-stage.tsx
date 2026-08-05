"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type WallLayerName = "background" | "ambient" | "content" | "effects" | "overlay"

export function WallStage({
  children,
  className,
  layout,
  aspect,
}: {
  children: ReactNode
  className?: string
  layout: "spotlight" | "grid" | "photo-focus"
  aspect: "wide" | "portrait"
}) {
  return (
    <div
      className={cn("relative min-w-0", aspect === "portrait" ? "max-h-[70vh] overflow-y-auto" : "", className)}
      data-wall-stage
      data-wall-layout={layout}
      data-wall-aspect={aspect}
    >
      <WallLayer name="background" />
      {children}
    </div>
  )
}

export function WallLayer({
  children,
  name,
  className,
}: {
  children?: ReactNode
  name: WallLayerName
  className?: string
}) {
  const isInteractive = name === "content" || name === "overlay"

  return (
    <div
      className={cn(
        name === "content" ? "relative z-10" : "absolute inset-0",
        name === "background" && "z-0 rounded-2xl border border-[var(--event-border)] bg-black/5",
        name === "ambient" && "pointer-events-none z-0",
        name === "effects" && "pointer-events-none z-20",
        name === "overlay" && "pointer-events-none z-30",
        isInteractive && name === "overlay" && "pointer-events-auto",
        className,
      )}
      data-wall-layer={name}
    >
      {children}
    </div>
  )
}
