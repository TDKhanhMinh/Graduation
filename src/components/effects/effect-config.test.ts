import { describe, expect, it } from "vitest"

import { EFFECT_PERFORMANCE_BUDGET, getEffectConfig, getParticleCount } from "./effect-config"

describe("effect config", () => {
  it("falls back to minimal for unknown presets", () => {
    expect(getEffectConfig("unknown").preset).toBe("minimal")
  })

  it("maps celebration to reaction and confetti capabilities", () => {
    expect(getEffectConfig("celebration")).toMatchObject({
      reactions: true,
      confetti: true,
      cursorInteraction: true,
    })
  })

  it("keeps the canvas performance budget bounded", () => {
    expect(EFFECT_PERFORMANCE_BUDGET.maxDevicePixelRatio).toBe(1.5)
    expect(EFFECT_PERFORMANCE_BUDGET.maxBackgroundCanvasLoops).toBe(1)
    expect(getParticleCount("high", 1440)).toBe(160)
  })

  it("keeps mobile particle counts below desktop counts", () => {
    expect(getParticleCount("medium", 390)).toBeLessThan(getParticleCount("medium", 1440))
    expect(getParticleCount("off", 1440)).toBe(0)
  })
})
