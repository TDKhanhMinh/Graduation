import { STICKER_MANIFEST } from "./sticker-manifest"
import { StickerCharacter } from "./StickerCharacter"
import type { StickerAction, StickerPerformanceOptions } from "./types"
import { getExclusionRects, preloadImage } from "./sticker-utils"

function getSpeechCategory(
  messages?: string[] | Record<string, string[]>,
  key?: string,
): string[] | undefined {
  if (!messages) return undefined
  if (Array.isArray(messages)) return messages
  if (key && typeof messages === "object" && key in messages) {
    return (messages as Record<string, string[]>)[key]
  }
  return undefined
}

export class StickerController {
  public characters: Map<string, StickerCharacter> = new Map()
  public isInitialized = false
  public isPaused = false

  private performanceOptions: StickerPerformanceOptions = {
    maxActiveStickers: 3,
    maxParticles: 60,
    targetFps: 60,
    enableShadows: true,
    enablePointerTracking: true,
    lowPowerMode: false,
  }

  constructor(activeStickerIds?: string[]) {
    for (const def of STICKER_MANIFEST) {
      if (!activeStickerIds || activeStickerIds.includes(def.id)) {
        this.characters.set(def.id, new StickerCharacter(def))
      }
    }
  }

  public async initialize(performanceOptions?: Partial<StickerPerformanceOptions>) {
    if (performanceOptions) {
      this.performanceOptions = { ...this.performanceOptions, ...performanceOptions }
    }

    const loadPromises = Array.from(this.characters.values()).map(async (char) => {
      try {
        const img = await preloadImage(char.def.src)
        char.image = img
      } catch {
        // Fallback
        char.image = null
      }
    })

    await Promise.all(loadPromises)
    this.isInitialized = true
  }

  public update(
    deltaTime: number,
    elapsedSeconds: number,
    containerSize: { width: number; height: number },
    pointerPos: { x: number; y: number },
    isMobile: boolean,
    exclusionSelectors: string[] = [],
    onSpawnParticles?: (
      x: number,
      y: number,
      type: "sparkle" | "heart" | "confetti" | "star",
      count: number,
    ) => void,
  ) {
    if (!this.isInitialized || this.isPaused) return

    const exclusionRects = getExclusionRects(exclusionSelectors)

    for (const char of this.characters.values()) {
      const particlesToSpawn = char.update(
        deltaTime,
        elapsedSeconds,
        containerSize,
        pointerPos,
        isMobile,
        exclusionRects,
      )

      if (particlesToSpawn && onSpawnParticles && !this.performanceOptions.lowPowerMode) {
        onSpawnParticles(
          char.screenX,
          char.screenY,
          particlesToSpawn.type,
          particlesToSpawn.count,
        )
      }

      // Autonomous action changes: Trigger actions automatically every 1.5 - 3 seconds
      if (char.actionCooldown <= 0) {
        if (Math.random() < 0.05) {
          const actions = char.def.idleActions
          const nextAction = actions[Math.floor(Math.random() * actions.length)]
          char.currentAction = nextAction
          char.actionTime = 0
          char.actionCooldown = 1.5 + Math.random() * 2
        }
      }

      // Autonomous speech trigger: Pop up speech bubbles automatically
      if (!char.activeSpeech && Math.random() < 0.005) {
        const messages = getSpeechCategory(char.def.speechMessages, "idle") || getSpeechCategory(char.def.speechMessages, "greeting")
        if (messages && messages.length > 0) {
          const msg = messages[Math.floor(Math.random() * messages.length)]
          char.triggerSpeech(msg, 3.5)
        }
      }
    }
  }

  public triggerCharacterAction(id: string, action: StickerAction) {
    const char = this.characters.get(id)
    if (!char) return
    char.setState("reacting", action)
    char.actionCooldown = 2

    const clickedMsgs = getSpeechCategory(char.def.speechMessages, "clicked")
    if (clickedMsgs && clickedMsgs.length > 0) {
      const msg = clickedMsgs[Math.floor(Math.random() * clickedMsgs.length)]
      char.triggerSpeech(msg, 3)
    }
  }

  public triggerSpeech(id: string, text: string, durationInSeconds: number = 3.5) {
    const char = this.characters.get(id)
    if (!char) return
    char.triggerSpeech(text, durationInSeconds)
  }

  public pointToElement(stickerId: string, selector: string, placement?: string) {
    const char = this.characters.get(stickerId)
    if (!char || typeof document === "undefined") return

    const element = document.querySelector(selector)
    if (!element) {
      char.setState("reacting", "point-to-cta")
      return
    }

    const rect = element.getBoundingClientRect()
    if (rect) {
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight
      
      let targetPixelX = rect.left + rect.width / 2
      let targetPixelY = rect.top + rect.height / 2
      
      // If placement is provided, shift the sticker so it points AT the element instead of covering it
      if (placement) {
        const offset = 60
        if (placement.includes("top")) targetPixelY = rect.top - offset
        if (placement.includes("bottom")) targetPixelY = rect.bottom + offset
        if (placement.includes("left")) targetPixelX = rect.left - offset
        if (placement.includes("right")) targetPixelX = rect.right + offset
      }

      char.targetNormalizedX = Math.min(Math.max(targetPixelX / containerWidth, 0.1), 0.9)
      char.targetNormalizedY = Math.min(Math.max(targetPixelY / containerHeight, 0.1), 0.9)
      char.setState("reacting", "point-to-cta")

      const rsvpMsgs = getSpeechCategory(char.def.speechMessages, "rsvp")
      if (rsvpMsgs && rsvpMsgs.length > 0) {
        char.triggerSpeech(rsvpMsgs[0], 3.5)
      }
    }
  }

  public teleportToElement(stickerId: string, selector: string, placement: "center" | "top-left" | "top" | "left" = "center") {
    const char = this.characters.get(stickerId)
    if (!char || typeof document === "undefined") return

    const element = document.querySelector(selector)
    if (!element) return

    const rect = element.getBoundingClientRect()
    if (rect) {
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight
      
      let pixelX = rect.left + rect.width / 2
      let pixelY = rect.top + rect.height / 2

      // Offset based on placement to avoid obscuring the element
      const charOffset = 50 // roughly half the sticker size + padding
      if (placement === "top-left") {
        pixelX = rect.left - charOffset / 2
        pixelY = rect.top - charOffset
      } else if (placement === "top") {
        pixelY = rect.top - charOffset
      } else if (placement === "left") {
        pixelX = rect.left - charOffset
      }
      
      const nx = Math.min(Math.max(pixelX / containerWidth, 0.1), 0.9)
      const ny = Math.min(Math.max(pixelY / containerHeight, 0.1), 0.9)
      
      char.normalizedX = nx
      char.normalizedY = ny
      char.targetNormalizedX = nx
      char.targetNormalizedY = ny
    }
  }

  public celebrateAll(duration = 3000) {
    for (const char of this.characters.values()) {
      const celebrationAction = char.def.celebrationAction || "celebrate"
      char.setState("celebrating", celebrationAction)

      const celebrationMsgs = getSpeechCategory(char.def.speechMessages, "celebration")
      if (celebrationMsgs && celebrationMsgs.length > 0) {
        const msg = celebrationMsgs[Math.floor(Math.random() * celebrationMsgs.length)]
        char.triggerSpeech(msg, duration / 1000)
      }
    }

    setTimeout(() => {
      for (const char of this.characters.values()) {
        char.setState("idle", "idle")
      }
    }, duration)
  }

  public pause() {
    this.isPaused = true
  }

  public resume() {
    this.isPaused = false
  }

  public reset() {
    for (const char of this.characters.values()) {
      char.normalizedX = char.def.initialPosition.x
      char.normalizedY = char.def.initialPosition.y
      char.targetNormalizedX = char.normalizedX
      char.targetNormalizedY = char.normalizedY
      char.setState("idle", "idle")
    }
  }
}
