"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"

import { StickerCanvas } from "./StickerCanvas"
import { StickerCelebration } from "./StickerCelebration"
import { StickerController } from "./StickerController"
import { StickerParticleSystem } from "./sticker-physics"
import { StickerSpeechOverlay } from "./StickerSpeechOverlay"
export type { InvitationStickerSceneHandle } from "./types"
import type {
  InvitationStickerSceneHandle,
  StickerAction,
  StickerSceneProps,
  StickerSnapshot,
} from "./types"

const DEFAULT_EXCLUSION: string[] = []

export const InvitationStickerScene = forwardRef<
  InvitationStickerSceneHandle,
  StickerSceneProps
>(function InvitationStickerScene(
  {
    enabled = true,
    exclusionSelectors = DEFAULT_EXCLUSION,
    activeStickerIds,
    celebrationTrigger,
    performanceOptions,
    className,
  },
  ref,
) {
  const activeIdsKey = activeStickerIds?.join(",")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const controller = useMemo(() => new StickerController(activeStickerIds), [activeIdsKey])
  const particleSystem = useMemo(() => new StickerParticleSystem(), [])
  const celebration = useMemo(
    () => new StickerCelebration(controller, particleSystem),
    [controller, particleSystem],
  )
  const [snapshots, setSnapshots] = useState<StickerSnapshot[]>([])

  // Watch celebrationTrigger prop changes
  useEffect(() => {
    if (celebrationTrigger && celebrationTrigger > 0) {
      celebration.celebrate({ intensity: "high", duration: 3000 })
    }
  }, [celebrationTrigger, celebration])

  useImperativeHandle(ref, () => ({
    celebrate: (options) => {
      celebration.celebrate(options)
    },
    focusSticker: (stickerId: string) => {
      controller.triggerCharacterAction(stickerId, "jump")
    },
    triggerAction: (stickerId: string, action: StickerAction) => {
      controller.triggerCharacterAction(stickerId, action)
    },
    pointToElement: (id, selector) => {
      controller.pointToElement(id, selector)
    },
    teleportToElement: (id, selector, placement) => {
      controller.teleportToElement(id, selector, placement)
    },
    triggerSpeech: (stickerId: string, text: string, duration?: number) => {
      controller.triggerSpeech(stickerId, text, duration)
    },
    pause: () => controller.pause(),
    resume: () => controller.resume(),
    reset: () => controller.reset(),
  }))

  if (!enabled) return null

  return (
    <div aria-hidden="true" className={className}>
      <StickerCanvas
        controller={controller}
        exclusionSelectors={exclusionSelectors}
        performanceOptions={performanceOptions}
        onSnapshotsUpdate={setSnapshots}
      />
      <StickerSpeechOverlay snapshots={snapshots} />
    </div>
  )
})
