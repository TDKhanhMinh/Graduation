import type { StickerCharacter } from "./StickerCharacter"
import type { StickerParticleSystem } from "./sticker-physics"

export class StickerRenderer {
  private debugMode = false

  constructor() {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      this.debugMode = urlParams.get("stickerDebug") === "1"
    }
  }

  public clear(context: CanvasRenderingContext2D, width: number, height: number) {
    context.clearRect(0, 0, width, height)
  }

  public renderScene(
    context: CanvasRenderingContext2D,
    characters: StickerCharacter[],
    particleSystem: StickerParticleSystem,
  ) {
    // Sort characters by zIndex
    const sorted = [...characters].sort((a, b) => a.def.zIndex - b.def.zIndex)

    for (const char of sorted) {
      if (!char.image || char.state === "hidden" || char.opacity <= 0) continue

      context.save()

      // Position transformation
      const drawX = char.screenX + char.offsetX
      const drawY = char.screenY + char.offsetY

      context.translate(drawX, drawY)
      context.rotate((char.rotation * Math.PI) / 180)
      context.scale(char.scaleX, char.scaleY)
      context.globalAlpha = char.opacity

      // Shadow
      context.shadowColor = "rgba(0, 0, 0, 0.25)"
      context.shadowBlur = 12
      context.shadowOffsetY = 6

      // Draw character image
      const halfW = char.width / 2
      const halfH = char.height / 2
      context.drawImage(char.image, -halfW, -halfH, char.width, char.height)

      // Optional debug bounding box
      if (this.debugMode) {
        context.shadowColor = "transparent"
        context.strokeStyle = char.isHovered ? "#f59e0b" : "#3b82f6"
        context.lineWidth = 2
        context.strokeRect(-halfW, -halfH, char.width, char.height)

        context.fillStyle = "#ffffff"
        context.font = "10px sans-serif"
        context.fillText(char.def.id, -halfW, -halfH - 4)
      }

      context.restore()
    }

    // Render particles on top
    particleSystem.draw(context)
  }
}
