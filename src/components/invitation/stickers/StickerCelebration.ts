import type { StickerController } from "./StickerController"
import type { StickerParticleSystem } from "./sticker-physics"

export class StickerCelebration {
  private controller: StickerController
  private particleSystem: StickerParticleSystem

  constructor(controller: StickerController, particleSystem: StickerParticleSystem) {
    this.controller = controller
    this.particleSystem = particleSystem
  }

  public celebrate(
    options: {
      intensity?: "low" | "medium" | "high"
      duration?: number
    } = {},
  ) {
    const intensity = options.intensity || "high"
    const duration = options.duration || 3000

    this.controller.celebrateAll(duration)

    const particleCount = intensity === "high" ? 25 : intensity === "medium" ? 15 : 8

    for (const char of this.controller.characters.values()) {
      this.particleSystem.spawn(
        char.screenX,
        char.screenY,
        char.def.id === "anime-party" ? "confetti" : "sparkle",
        particleCount,
      )
    }
  }
}
