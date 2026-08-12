import type { StickerCharacter } from "./StickerCharacter"
import type { StickerController } from "./StickerController"

export class StickerInteractionManager {
  private controller: StickerController
  private containerEl: HTMLElement | null = null

  public pointerPos = { x: -1000, y: -1000 }
  private activeDraggedChar: StickerCharacter | null = null
  private dragOffset = { x: 0, y: 0 }
  private pointerDownPos = { x: 0, y: 0 }
  private isPointerDown = false

  constructor(controller: StickerController) {
    this.controller = controller
  }

  public attach(containerEl: HTMLElement) {
    this.containerEl = containerEl

    window.addEventListener("pointermove", this.handlePointerMove)
    window.addEventListener("pointerdown", this.handlePointerDown)
    window.addEventListener("pointerup", this.handlePointerUp)
    window.addEventListener("pointercancel", this.handlePointerUp)
  }

  public detach() {
    window.removeEventListener("pointermove", this.handlePointerMove)
    window.removeEventListener("pointerdown", this.handlePointerDown)
    window.removeEventListener("pointerup", this.handlePointerUp)
    window.removeEventListener("pointercancel", this.handlePointerUp)
    this.containerEl = null
  }

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.containerEl) return
    const rect = this.containerEl.getBoundingClientRect()
    this.pointerPos.x = e.clientX - rect.left
    this.pointerPos.y = e.clientY - rect.top

    // Update drag position if active
    if (this.activeDraggedChar && this.containerEl) {
      const normalizedX = (this.pointerPos.x - this.dragOffset.x) / rect.width
      const normalizedY = (this.pointerPos.y - this.dragOffset.y) / rect.height

      this.activeDraggedChar.normalizedX = Math.min(Math.max(normalizedX, 0.05), 0.95)
      this.activeDraggedChar.normalizedY = Math.min(Math.max(normalizedY, 0.05), 0.95)
      this.activeDraggedChar.targetNormalizedX = this.activeDraggedChar.normalizedX
      this.activeDraggedChar.targetNormalizedY = this.activeDraggedChar.normalizedY
    }

    // Update hover state
    for (const char of this.controller.characters.values()) {
      char.isHovered = char.isHit(this.pointerPos.x, this.pointerPos.y)
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.containerEl) return
    const rect = this.containerEl.getBoundingClientRect()
    this.pointerPos.x = e.clientX - rect.left
    this.pointerPos.y = e.clientY - rect.top
    this.pointerDownPos = { ...this.pointerPos }
    this.isPointerDown = true

    // Check hit test
    const chars = Array.from(this.controller.characters.values()).sort(
      (a, b) => b.def.zIndex - a.def.zIndex,
    )

    for (const char of chars) {
      if (char.isHit(this.pointerPos.x, this.pointerPos.y)) {
        if (char.isDraggable) {
          this.activeDraggedChar = char
          char.isDragging = true
          this.dragOffset.x = this.pointerPos.x - char.screenX
          this.dragOffset.y = this.pointerPos.y - char.screenY
        }
        break
      }
    }
  }

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isPointerDown) return

    const distMoved = Math.hypot(
      this.pointerPos.x - this.pointerDownPos.x,
      this.pointerPos.y - this.pointerDownPos.y,
    )

    // Tap detection (moved less than 8px)
    if (distMoved < 8) {
      const chars = Array.from(this.controller.characters.values()).sort(
        (a, b) => b.def.zIndex - a.def.zIndex,
      )

      for (const char of chars) {
        if (char.isHit(this.pointerPos.x, this.pointerPos.y) && char.isClickable) {
          const interactionActions = char.def.interactionActions
          const nextAction =
            interactionActions[Math.floor(Math.random() * interactionActions.length)]
          this.controller.triggerCharacterAction(char.def.id, nextAction)
          break
        }
      }
    }

    if (this.activeDraggedChar) {
      this.activeDraggedChar.isDragging = false
      this.activeDraggedChar = null
    }

    this.isPointerDown = false
  }
}
