import { z } from "zod"

import type { EffectIntensity, EffectPreset } from "@/components/effects/effect-config"

export const WELCOME_HERO_CONFIG_VERSION = 1 as const

export const welcomeHeroConfigSchema = z.object({
  version: z.literal(WELCOME_HERO_CONFIG_VERSION),
  enabled: z.boolean(),
  layout: z.enum(["poster-focus", "split", "full-bleed", "minimal"]),
  message: z.string().trim().max(500).nullable(),
  showDate: z.boolean(),
  showLocation: z.boolean(),
  showHost: z.boolean(),
  primaryAction: z.enum(["submit-wish", "explore"]),
  primaryLabel: z.string().trim().min(1).max(80),
  secondaryLabel: z.string().trim().min(1).max(80),
  poster: z.object({
    aspectRatio: z.enum(["auto", "portrait", "square", "landscape"]).default("portrait"),
    fit: z.enum(["contain", "cover"]),
    position: z.enum(["center", "top", "bottom"]),
    border: z.boolean(),
    shadow: z.boolean(),
    backgroundBlur: z.boolean(),
  }),
  effects: z.object({
    preset: z.enum(["minimal", "elegant", "romantic", "graduation", "celebration", "galaxy"]),
    intensity: z.enum(["off", "low", "medium", "high"]),
    particles: z.boolean(),
    introAnimation: z.boolean(),
  }),
})

export type WelcomeHeroConfig = z.infer<typeof welcomeHeroConfigSchema>

type LegacyWelcomeSettings = {
  experience_preset?: string | null
  effect_intensity?: string | null
}

const fallbackPreset = (value: string | null | undefined): EffectPreset => {
  const presets: EffectPreset[] = ["minimal", "elegant", "romantic", "graduation", "celebration", "galaxy"]
  return presets.includes(value as EffectPreset) ? value as EffectPreset : "minimal"
}

const fallbackIntensity = (value: string | null | undefined): EffectIntensity => {
  const intensities: EffectIntensity[] = ["off", "low", "medium", "high"]
  return intensities.includes(value as EffectIntensity) ? value as EffectIntensity : "low"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getDefaultWelcomeHeroConfig(legacy: LegacyWelcomeSettings = {}): WelcomeHeroConfig {
  return {
    version: WELCOME_HERO_CONFIG_VERSION,
    enabled: true,
    layout: "split",
    message: null,
    showDate: true,
    showLocation: true,
    showHost: true,
    primaryAction: "submit-wish",
    primaryLabel: "Gửi lời chúc",
    secondaryLabel: "Khám phá sự kiện",
    poster: {
      aspectRatio: "portrait",
      fit: "contain",
      position: "center",
      border: true,
      shadow: true,
      backgroundBlur: true,
    },
    effects: {
      preset: fallbackPreset(legacy.experience_preset),
      intensity: fallbackIntensity(legacy.effect_intensity),
      particles: true,
      introAnimation: true,
    },
  }
}

export function normalizeWelcomeHeroConfig(
  input: unknown,
  legacy: LegacyWelcomeSettings = {},
): WelcomeHeroConfig {
  const fallback = getDefaultWelcomeHeroConfig(legacy)
  if (!isRecord(input)) return fallback

  const candidate = {
    ...fallback,
    ...input,
    poster: {
      ...fallback.poster,
      ...(isRecord(input.poster) ? input.poster : {}),
    },
    effects: {
      ...fallback.effects,
      ...(isRecord(input.effects) ? input.effects : {}),
    },
  }
  const result = welcomeHeroConfigSchema.safeParse(candidate)
  return result.success ? result.data : fallback
}
