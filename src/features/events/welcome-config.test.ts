import { describe, expect, it } from "vitest"

import {
  getDefaultWelcomeHeroConfig,
  normalizeWelcomeHeroConfig,
  welcomeHeroConfigSchema,
} from "./welcome-config"

describe("Welcome Hero config contract", () => {
  it("provides deterministic defaults while preserving legacy effect settings", () => {
    expect(getDefaultWelcomeHeroConfig({
      experience_preset: "romantic",
      effect_intensity: "medium",
    })).toMatchObject({
      version: 1,
      enabled: true,
      layout: "split",
      effects: { preset: "romantic", intensity: "medium" },
    })
  })

  it("normalizes a valid stored config without dropping nested defaults", () => {
    expect(normalizeWelcomeHeroConfig({
      version: 1,
      layout: "poster-focus",
      effects: { preset: "graduation", intensity: "high", particles: false, introAnimation: false },
    })).toMatchObject({
      enabled: true,
      layout: "poster-focus",
      showDate: true,
      poster: { fit: "contain", backgroundBlur: true },
      effects: { preset: "graduation", intensity: "high", particles: false, introAnimation: false },
    })
  })

  it("falls back safely for invalid or private-shaped values", () => {
    const config = normalizeWelcomeHeroConfig({
      version: 99,
      layout: "unknown",
      owner_id: "private-value",
    }, { experience_preset: "elegant" })

    expect(config).toEqual(getDefaultWelcomeHeroConfig({ experience_preset: "elegant" }))
    expect(config).not.toHaveProperty("owner_id")
  })

  it("rejects configs with invalid enum values", () => {
    expect(welcomeHeroConfigSchema.safeParse({
      ...getDefaultWelcomeHeroConfig(),
      layout: "unknown",
    }).success).toBe(false)
  })
})
