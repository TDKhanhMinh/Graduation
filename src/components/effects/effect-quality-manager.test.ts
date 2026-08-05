import { describe, expect, it } from "vitest"

import { getEffectQualityBudget, resolveEffectQuality } from "./effect-quality-manager"

const baseSignals = {
  hardwareConcurrency: 4,
  devicePixelRatio: 1,
  isVisible: true,
  reducedMotion: false,
}

describe("effect quality manager", () => {
  it("keeps explicit quality overrides stable", () => {
    expect(resolveEffectQuality("low", { ...baseSignals, hardwareConcurrency: 16 })).toBe("low")
    expect(resolveEffectQuality("high", { ...baseSignals, hardwareConcurrency: 2 })).toBe("high")
  })

  it("selects conservative auto quality from device and runtime signals", () => {
    expect(resolveEffectQuality("auto", { ...baseSignals, hardwareConcurrency: 2 })).toBe("low")
    expect(resolveEffectQuality("auto", { ...baseSignals, fps: 24 })).toBe("low")
    expect(resolveEffectQuality("auto", { ...baseSignals, hardwareConcurrency: 8, fps: 60 })).toBe("high")
    expect(resolveEffectQuality("auto", { ...baseSignals, fps: 42 })).toBe("medium")
  })

  it("forces a safe budget for reduced motion and caps high quality", () => {
    expect(getEffectQualityBudget("high").maxPixelRatio).toBe(1.5)
    expect(getEffectQualityBudget("low").maxBlurPixels).toBeLessThan(getEffectQualityBudget("high").maxBlurPixels)
    expect(getEffectQualityBudget("high", true)).toMatchObject({
      particleMultiplier: 0,
      animationsEnabled: false,
    })
  })
})
