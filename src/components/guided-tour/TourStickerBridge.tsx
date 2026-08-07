"use client"

import { useEffect, useRef } from "react"
import type { GuidedTourStep } from "./types"
import type { InvitationStickerSceneHandle } from "@/components/invitation/stickers/InvitationStickerScene"
import type { StickerAction } from "@/components/invitation/stickers/types"

type TourStickerBridgeProps = {
  step: GuidedTourStep
  sceneRef: React.RefObject<InvitationStickerSceneHandle | null>
  mascotId?: string // Defaults to "anime-party" from manifest
}

export function TourStickerBridge({ step, sceneRef, mascotId = "anime-party" }: TourStickerBridgeProps) {
  const prevStepId = useRef<string | null>(null)

  useEffect(() => {
    if (!sceneRef.current || !step) return
    
    let frameId: number | null = null
    const isNewStep = prevStepId.current !== step.id

    if (step.mascotAction) {
      if (step.mascotAction === "point-to-content" && step.targetSelector) {
        // Initial point with speech (if new step)
        if (isNewStep) {
          sceneRef.current.pointToElement(mascotId, step.targetSelector, step.placement || "center", true)
        }
        
        // Continuously track position (handles smooth scrolling) without re-triggering speech
        const trackPosition = () => {
          sceneRef.current?.pointToElement(mascotId, step.targetSelector!, step.placement || "center", false)
          frameId = requestAnimationFrame(trackPosition)
        }
        frameId = requestAnimationFrame(trackPosition)
      } else {
        if (isNewStep) sceneRef.current.triggerAction(mascotId, step.mascotAction as StickerAction)
      }
    } else {
      if (isNewStep) sceneRef.current.triggerAction(mascotId, "idle")
    }
    
    if (isNewStep && step.speech) {
      // Pass a long duration so the speech bubble stays up while the user reads the tour card
      sceneRef.current.triggerSpeech(mascotId, step.speech, 10)
    }

    prevStepId.current = step.id

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [step, sceneRef, mascotId])

  useEffect(() => {
    const refCurrent = sceneRef.current
    return () => {
      if (refCurrent) {
        refCurrent.reset()
      }
    }
  }, [sceneRef])

  return null
}
