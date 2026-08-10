import { act, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { InvitationStickerSceneHandle } from "@/components/invitation/stickers/types"
import { dashboardTourConfig } from "./config-dashboard"
import { TOUR_CARD_SELECTOR, type GuidedTourStep } from "./types"
import { TourRunner } from "./TourRunner"
import { TourStickerBridge } from "./TourStickerBridge"

function createSceneHandle() {
  return {
    moveToElement: vi.fn(),
    pointToElement: vi.fn(),
    triggerAction: vi.fn(),
    triggerSpeech: vi.fn(),
    reset: vi.fn(),
  } as unknown as InvitationStickerSceneHandle
}

describe("TourStickerBridge", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ["preview", "wave"],
    ["submit", "celebrate"],
  ] as const)(
    "keeps the mascot left of the guidance card for the %s step",
    (id, mascotAction) => {
      let animationFrameCallback: FrameRequestCallback | undefined
      const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
        animationFrameCallback = callback
        return 1
      })
      const cancelAnimationFrame = vi.fn()
      vi.stubGlobal("requestAnimationFrame", requestAnimationFrame)
      vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame)

      const scene = createSceneHandle()
      const sceneRef = { current: scene }
      const step = dashboardTourConfig.steps.find((candidate) => candidate.id === id)
      expect(step).toMatchObject({
        mascotAnchor: "tour-card",
        mascotPlacement: "left",
        mascotOffset: 60,
        mascotAction,
      })

      const { unmount } = render(
        <TourStickerBridge step={step!} sceneRef={sceneRef} />,
      )

      expect(scene.moveToElement).toHaveBeenCalledWith(
        "anime-party",
        TOUR_CARD_SELECTOR,
        "left",
        60,
      )
      expect(scene.triggerAction).toHaveBeenCalledWith(
        "anime-party",
        mascotAction,
      )

      act(() => animationFrameCallback?.(0))
      expect(scene.moveToElement).toHaveBeenCalledTimes(2)

      unmount()
      expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
    },
  )

  it("keeps the tour card above the mascot stacking layer", () => {
    const scene = createSceneHandle()
    const introStep: GuidedTourStep = {
      id: "intro",
      title: "Intro",
      content: "Intro content",
      targetSelector: null,
      condition: "always",
      mascotAction: "wave",
      speech: "Intro speech",
    }

    render(
      <TourRunner
        config={{ tourId: "layering-test", version: "v1", steps: [introStep] }}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
        reducedMotion
        sceneRef={{ current: scene }}
      />,
    )

    const tourRoot = document.querySelector<HTMLElement>(".tour-root")
    const tourCard = document.querySelector<HTMLElement>(
      "[aria-labelledby='tour-step-title']",
    )

    expect(tourRoot?.style.zIndex).toBe("")
    expect(tourCard).toHaveClass("z-[120]")
  })
})
