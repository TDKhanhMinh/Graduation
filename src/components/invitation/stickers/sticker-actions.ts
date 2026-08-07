import type { StickerAction } from "./types"

export interface ActionFrameResult {
  offsetX: number
  offsetY: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  particlesToSpawn?: {
    type: "sparkle" | "heart" | "confetti" | "star"
    count: number
  }
}

export function computeStickerActionTransform(
  action: StickerAction,
  elapsedSeconds: number,
  actionTime: number,
  pointerAngle: number = 0,
  pointerDistance: number = 1000,
): ActionFrameResult {
  const result: ActionFrameResult = {
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  }

  switch (action) {
    case "idle": {
      // Gentle bobbing and subtle breathing sway
      const t = elapsedSeconds * 2.5
      result.offsetY = Math.sin(t) * 3
      result.rotation = Math.sin(t * 0.5) * 2
      result.scaleX = 1 + Math.sin(t * 1.2) * 0.02
      result.scaleY = 1 - Math.sin(t * 1.2) * 0.02
      break
    }

    case "bounce": {
      // Squash & stretch bounce
      const t = (actionTime % 0.8) / 0.8
      const jumpProgress = Math.sin(t * Math.PI)
      result.offsetY = -jumpProgress * 24

      if (t < 0.15) {
        // Pre-jump squash
        const squash = t / 0.15
        result.scaleX = 1 + squash * 0.15
        result.scaleY = 1 - squash * 0.15
      } else if (t > 0.85) {
        // Recovery squash
        const recover = (1 - t) / 0.15
        result.scaleX = 1 + recover * 0.12
        result.scaleY = 1 - recover * 0.12
      } else {
        // Mid-air stretch
        result.scaleX = 0.92
        result.scaleY = 1.08
      }
      break
    }

    case "jump": {
      // High parabolic jump with rotation
      const t = Math.min(actionTime / 1.0, 1)
      const height = Math.sin(t * Math.PI) * 45
      result.offsetY = -height
      result.rotation = Math.sin(t * Math.PI * 2) * 8

      if (t < 0.2) {
        result.scaleX = 1.15
        result.scaleY = 0.85
      } else if (t > 0.8) {
        result.scaleX = 1.1
        result.scaleY = 0.9
      } else {
        result.scaleX = 0.88
        result.scaleY = 1.12
      }
      break
    }

    case "wave": {
      // Wiggling side to side
      const t = actionTime * 6
      result.rotation = Math.sin(t) * 14
      result.offsetY = Math.abs(Math.sin(t)) * -4
      break
    }

    case "blink": {
      // Simulated eye blink via vertical scale squeeze
      const t = (actionTime % 2.5) / 2.5
      if (t > 0.9) {
        const blinkT = (t - 0.9) / 0.1
        result.scaleY = 1 - Math.sin(blinkT * Math.PI) * 0.6
      }
      break
    }

    case "dance": {
      // Rhythmic side-to-side dance step
      const t = actionTime * 5
      result.offsetX = Math.sin(t) * 10
      result.offsetY = Math.abs(Math.cos(t)) * -12
      result.rotation = Math.sin(t) * 10
      result.scaleX = 1 + Math.sin(t * 2) * 0.05
      break
    }

    case "float": {
      // Smooth sine wave floating
      const t = elapsedSeconds * 1.5
      result.offsetX = Math.cos(t * 0.8) * 8
      result.offsetY = Math.sin(t) * 12
      result.rotation = Math.sin(t * 0.6) * 4
      break
    }

    case "peek": {
      // Peeking in from corner
      const t = Math.min(actionTime / 0.8, 1)
      const peekIn = Math.sin(t * (Math.PI / 2))
      result.offsetX = (1 - peekIn) * -30
      result.rotation = (1 - peekIn) * -15
      break
    }

    case "sparkle": {
      // Pulsing glow + sparkle particle burst
      const t = actionTime * 4
      result.scaleX = 1 + Math.sin(t) * 0.08
      result.scaleY = 1 + Math.sin(t) * 0.08
      if (Math.random() < 0.2) {
        result.particlesToSpawn = { type: "sparkle", count: 2 }
      }
      break
    }

    case "celebrate":
    case "throw-confetti": {
      // High celebratory jumps with confetti particles
      const t = actionTime * 6
      result.offsetY = -Math.abs(Math.sin(t)) * 30
      result.rotation = Math.sin(t * 0.5) * 12
      result.scaleX = 1 + Math.sin(t) * 0.1
      result.scaleY = 1 - Math.sin(t) * 0.1
      if (Math.random() < 0.3) {
        result.particlesToSpawn = { type: action === "throw-confetti" ? "confetti" : "star", count: 3 }
      }
      break
    }

    case "look-at-pointer": {
      // Tilting slightly towards pointer direction
      result.rotation = Math.max(-15, Math.min(15, (pointerAngle * 180) / Math.PI * 0.25))
      result.offsetX = Math.cos(pointerAngle) * 5
      result.offsetY = Math.sin(pointerAngle) * 5
      break
    }

    case "follow-pointer": {
      // Offset towards pointer with distance damping
      const dampedDist = Math.min(pointerDistance, 40)
      result.offsetX = Math.cos(pointerAngle) * dampedDist * 0.3
      result.offsetY = Math.sin(pointerAngle) * dampedDist * 0.3
      result.rotation = Math.sin(actionTime * 3) * 6
      break
    }

    case "point-to-content":
    case "point-to-cta": {
      // Leaning & pointing gesture towards target
      const t = actionTime * 4
      result.rotation = Math.sin(t) * 8 - 12
      result.offsetX = Math.cos(t) * 6 + 10
      result.scaleX = 1.08
      break
    }

    case "run-across-screen": {
      // Quick dash run cycle
      const t = actionTime * 8
      result.offsetX = Math.sin(t * 0.5) * 40
      result.offsetY = -Math.abs(Math.sin(t)) * 14
      result.rotation = Math.sin(t) * 10
      break
    }

    case "sleep": {
      // Slow breathing
      const t = elapsedSeconds * 0.8
      result.scaleX = 1 + Math.sin(t) * 0.04
      result.scaleY = 1 - Math.sin(t) * 0.04
      result.offsetY = 3
      result.rotation = 5
      break
    }

    default:
      break
  }

  return result
}
