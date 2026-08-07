import { computeStickerActionTransform } from "./sticker-actions"
import type { Rect } from "./sticker-utils"
import { isPointInRect } from "./sticker-utils"
import type {
  StickerAction,
  StickerCharacterDefinition,
  StickerSnapshot,
  StickerState,
} from "./types"

export class StickerCharacter {
  public readonly def: StickerCharacterDefinition
  public image: HTMLImageElement | null = null

  // State Machine
  public state: StickerState = "entering"
  public currentAction: StickerAction = "idle"
  public actionTime = 0
  public stateTime = 0
  public actionCooldown = 0

  // Coordinates
  public normalizedX: number
  public normalizedY: number
  public targetNormalizedX: number
  public targetNormalizedY: number

  public screenX = 0
  public screenY = 0
  public width = 64
  public height = 64

  // Transforms
  public offsetX = 0
  public offsetY = 0
  public rotation = 0
  public scaleX = 1
  public scaleY = 1
  public opacity = 1

  // Interactions & Dodging
  public activeSpeech: string | null = null
  public speechTimer = 0
  public isHovered = false
  public isDragging = false
  public isClickable = true
  public isDraggable = true
  public dodgeCount = 0

  // Physics velocity
  public vx = 0
  public vy = 0

  constructor(def: StickerCharacterDefinition) {
    this.def = def
    this.normalizedX = def.initialPosition.x
    this.normalizedY = def.initialPosition.y
    this.targetNormalizedX = this.normalizedX
    this.targetNormalizedY = this.normalizedY
    this.currentAction = def.entranceAction
    this.isClickable = def.clickable ?? true
    this.isDraggable = def.draggable ?? true
  }

  public setState(newState: StickerState, action?: StickerAction) {
    if (this.state === newState && (!action || this.currentAction === action)) return
    this.state = newState
    this.stateTime = 0
    if (action) {
      this.currentAction = action
      this.actionTime = 0
    }
  }

  public triggerSpeech(message: string, duration = 3.5) {
    this.activeSpeech = message
    this.speechTimer = duration
  }

  public update(
    deltaTime: number,
    elapsedSeconds: number,
    containerSize: { width: number; height: number },
    pointerPos: { x: number; y: number },
    isMobile: boolean,
    exclusionRects: Rect[] = [],
  ) {
    this.stateTime += deltaTime
    this.actionTime += deltaTime
    if (this.actionCooldown > 0) this.actionCooldown -= deltaTime

    if (this.speechTimer > 0) {
      this.speechTimer -= deltaTime
      if (this.speechTimer <= 0) {
        this.activeSpeech = null
      }
    }

    // Size calculation
    const baseSize = isMobile ? this.def.size.mobile : this.def.size.desktop
    this.width = baseSize
    this.height = baseSize

    // Position interpolation
    if (!this.isDragging) {
      this.normalizedX += (this.targetNormalizedX - this.normalizedX) * 0.1
      this.normalizedY += (this.targetNormalizedY - this.normalizedY) * 0.1
    }

    let calculatedX = this.normalizedX * containerSize.width
    let calculatedY = this.normalizedY * containerSize.height

    // Pointer distance & angle
    const dx = pointerPos.x - calculatedX
    const dy = pointerPos.y - calculatedY
    const pointerDistance = Math.hypot(dx, dy)
    const pointerAngle = Math.atan2(dy, dx)

    // Personality Behavior Mechanics
    if (this.def.personality === "shy" && pointerDistance < 80 && !this.isDragging) {
      // Shy character retreats away from pointer
      calculatedX -= Math.cos(pointerAngle) * 15
      calculatedY -= Math.sin(pointerAngle) * 15
    } else if (this.def.personality === "playful" && pointerDistance < 50 && this.dodgeCount < 2 && !this.isDragging) {
      // Playful character dodges pointer up to 2 times
      this.dodgeCount++
      this.targetNormalizedX = Math.min(Math.max(this.targetNormalizedX + (Math.random() - 0.5) * 0.2, 0.1), 0.9)
      this.targetNormalizedY = Math.min(Math.max(this.targetNormalizedY + (Math.random() - 0.5) * 0.2, 0.1), 0.9)
      this.setState("reacting", "jump")
    }

    // Exclusion Rectangles Safe Zone Avoidance
    const padding = this.def.safeZone?.padding || 12
    for (const rect of exclusionRects) {
      if (isPointInRect(calculatedX, calculatedY, rect, padding)) {
        // Shift away from center of exclusion rectangle
        const rectCenterX = (rect.left + rect.right) / 2
        const rectCenterY = (rect.top + rect.bottom) / 2
        const pushAngle = Math.atan2(calculatedY - rectCenterY, calculatedX - rectCenterX)

        calculatedX += Math.cos(pushAngle) * 20
        calculatedY += Math.sin(pushAngle) * 20
      }
    }

    this.screenX = calculatedX
    this.screenY = calculatedY

    // Calculate action transform
    const transform = computeStickerActionTransform(
      this.currentAction,
      elapsedSeconds,
      this.actionTime,
      pointerAngle,
      pointerDistance,
    )

    this.offsetX = transform.offsetX
    this.offsetY = transform.offsetY
    this.rotation = transform.rotation
    this.scaleX = transform.scaleX
    this.scaleY = transform.scaleY
    this.opacity = transform.opacity

    return transform.particlesToSpawn
  }

  public getSnapshot(): StickerSnapshot {
    return {
      id: this.def.id,
      name: this.def.name,
      x: this.screenX + this.offsetX,
      y: this.screenY + this.offsetY,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      opacity: this.opacity,
      state: this.state,
      currentAction: this.currentAction,
      activeSpeech: this.activeSpeech,
      isHovered: this.isHovered,
      isDragging: this.isDragging,
    }
  }

  public isHit(x: number, y: number): boolean {
    const halfW = (this.width * this.scaleX) / 2
    const halfH = (this.height * this.scaleY) / 2
    const centerX = this.screenX + this.offsetX
    const centerY = this.screenY + this.offsetY

    return (
      x >= centerX - halfW &&
      x <= centerX + halfW &&
      y >= centerY - halfH &&
      y <= centerY + halfH
    )
  }
}
