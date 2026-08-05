import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

import { getEffectConfig, type EffectIntensity, type EffectPreset } from "./effect-config"

const palettes: Record<EffectPreset, { first: string; second: string; third: string }> = {
  minimal: { first: "var(--brand-100)", second: "var(--background)", third: "var(--memory-peach)" },
  romantic: { first: "var(--memory-pink)", second: "var(--memory-peach)", third: "var(--brand-100)" },
  celebration: { first: "#f9a8d4", second: "#fcd34d", third: "#c4b5fd" },
  graduation: { first: "#312e81", second: "#7c3aed", third: "#facc15" },
  elegant: { first: "var(--brand-200)", second: "var(--memory-peach)", third: "var(--memory-gold)" },
  galaxy: { first: "#312e81", second: "#0f172a", third: "#38bdf8" },
}

export function AuroraBackground({
  className,
  intensity = "low",
  preset = "minimal",
}: {
  className?: string
  intensity?: EffectIntensity
  preset?: EffectPreset
}) {
  const config = getEffectConfig(preset, intensity)
  const palette = palettes[config.preset]

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 isolate overflow-hidden opacity-70",
        config.intensity === "off" && "hidden",
        className,
      )}
      style={{
        "--aurora-first": palette.first,
        "--aurora-second": palette.second,
        "--aurora-third": palette.third,
      } as CSSProperties}
    >
      <div className="aurora-blob aurora-blob-first" />
      <div className="aurora-blob aurora-blob-second" />
      <div className="aurora-blob aurora-blob-third" />
    </div>
  )
}
