export const EFFECT_PRESETS = [
  "minimal",
  "romantic",
  "celebration",
  "graduation",
  "elegant",
  "galaxy",
] as const

export type EffectPreset = (typeof EFFECT_PRESETS)[number]
export type EffectIntensity = "off" | "low" | "medium" | "high"

export const EFFECT_PERFORMANCE_BUDGET = {
  maxDevicePixelRatio: 1.5,
  maxBackgroundCanvasLoops: 1,
  maxForegroundCanvasLoops: 1,
  particles: {
    mobile: { low: 24, medium: 40, high: 56 },
    desktop: { low: 56, medium: 100, high: 160 },
  },
} as const

export type EventEffectConfig = {
  preset: EffectPreset
  intensity: EffectIntensity
  particles: boolean
  reactions: boolean
  confetti: boolean
  cursorInteraction: boolean
}

export const DEFAULT_EFFECT_CONFIG: EventEffectConfig = {
  preset: "minimal",
  intensity: "low",
  particles: true,
  reactions: true,
  confetti: false,
  cursorInteraction: false,
}

const PRESET_CONFIG: Record<EffectPreset, Partial<EventEffectConfig>> = {
  minimal: { particles: true, reactions: false, confetti: false, cursorInteraction: false },
  romantic: { particles: true, reactions: true, confetti: false, cursorInteraction: true },
  celebration: { particles: true, reactions: true, confetti: true, cursorInteraction: true },
  graduation: { particles: true, reactions: true, confetti: true, cursorInteraction: false },
  elegant: { particles: true, reactions: true, confetti: false, cursorInteraction: false },
  galaxy: { particles: true, reactions: true, confetti: false, cursorInteraction: true },
}

export function getEffectConfig(
  preset: string | null | undefined,
  intensity: EffectIntensity = DEFAULT_EFFECT_CONFIG.intensity,
): EventEffectConfig {
  const normalizedPreset = EFFECT_PRESETS.includes(preset as EffectPreset)
    ? (preset as EffectPreset)
    : DEFAULT_EFFECT_CONFIG.preset

  return {
    ...DEFAULT_EFFECT_CONFIG,
    ...PRESET_CONFIG[normalizedPreset],
    preset: normalizedPreset,
    intensity,
  }
}

export function getParticleCount(
  intensity: EffectIntensity,
  viewportWidth: number,
  particleMultiplier: number = 1,
): number {
  if (intensity === "off") return 0

  const mobile = viewportWidth < 640
  const counts = mobile
    ? EFFECT_PERFORMANCE_BUDGET.particles.mobile
    : EFFECT_PERFORMANCE_BUDGET.particles.desktop

  return Math.floor(counts[intensity] * particleMultiplier)
}
