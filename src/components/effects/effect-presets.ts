import {
  getEffectConfig,
  type EffectIntensity,
  type EffectPreset,
  type EventEffectConfig,
} from "./effect-config"

const EVENT_THEME_PRESETS: Record<string, EffectPreset> = {
  graduation: "graduation",
  editorial: "elegant",
  minimal: "minimal",
}

export function getPresetForTheme(themeKey: string | null | undefined): EffectPreset {
  return EVENT_THEME_PRESETS[themeKey ?? ""] ?? "minimal"
}

export function getEventEffectConfig(
  themeKey: string | null | undefined,
  intensity: EffectIntensity = "low",
): EventEffectConfig {
  return getEffectConfig(getPresetForTheme(themeKey), intensity)
}
