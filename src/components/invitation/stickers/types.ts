export type StickerAction =
  | "idle"
  | "wave"
  | "blink"
  | "bounce"
  | "jump"
  | "dance"
  | "peek"
  | "float"
  | "sleep"
  | "sparkle"
  | "celebrate"
  | "throw-confetti"
  | "look-at-pointer"
  | "follow-pointer"
  | "point-to-content"
  | "point-to-cta"
  | "run-across-screen"

export type StickerState =
  | "hidden"
  | "entering"
  | "idle"
  | "reacting"
  | "moving"
  | "celebrating"
  | "sleeping"
  | "exiting"

export type StickerPersonality =
  | "cheerful"
  | "shy"
  | "playful"
  | "energetic"
  | "gentle"
  | "mischievous"

export interface StickerCharacterDefinition {
  id: string
  name: string
  src: string

  personality: StickerPersonality

  initialPosition: {
    x: number // Normalized 0..1
    y: number // Normalized 0..1
  }

  mobilePosition?: {
    x: number
    y: number
  }

  size: {
    desktop: number
    mobile: number
  }

  anchor: {
    x: number // 0..1
    y: number // 0..1
  }

  zIndex: number

  entranceAction: StickerAction
  idleActions: StickerAction[]
  interactionActions: StickerAction[]
  celebrationAction?: StickerAction

  clickable?: boolean
  draggable?: boolean
  followPointer?: boolean

  speechMessages?: string[] | Record<string, string[]>

  safeZone?: {
    padding: number
  }

  sectionId?: string
}

export interface StickerPerformanceOptions {
  maxActiveStickers: number
  maxParticles: number
  targetFps: 30 | 60
  enableShadows: boolean
  enablePointerTracking: boolean
  lowPowerMode: boolean
}

export interface StickerSceneProps {
  containerRef?: React.RefObject<HTMLElement | null>
  exclusionSelectors?: string[]
  enabled?: boolean
  interactive?: boolean
  celebrationTrigger?: number
  performanceOptions?: Partial<StickerPerformanceOptions>
  className?: string
}

export interface InvitationStickerSceneHandle {
  celebrate(options?: {
    intensity?: "low" | "medium" | "high"
    duration?: number
  }): void

  focusSticker(stickerId: string): void

  triggerAction(stickerId: string, action: StickerAction): void

  pointToElement(stickerId: string, selector: string): void

  pause(): void
  resume(): void
  reset(): void
}

export interface StickerSnapshot {
  id: string
  name: string
  x: number // Screen pixel x
  y: number // Screen pixel y
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  state: StickerState
  currentAction: StickerAction
  activeSpeech: string | null
  isHovered: boolean
  isDragging: boolean
}
