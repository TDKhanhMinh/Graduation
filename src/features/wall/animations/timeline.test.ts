import { describe, expect, it } from "vitest"

import { createTimelinePlan, getTimelinePhase } from "./timeline"

describe("content-aware timeline", () => {
  it("uses distinct text, image and video durations", () => {
    const text = createTimelinePlan({ contentType: "text" })
    const image = createTimelinePlan({ contentType: "image" })
    const video = createTimelinePlan({ contentType: "video" })

    expect(text.totalDuration).toBe(7000)
    expect(image.totalDuration).toBe(8000)
    expect(video.totalDuration).toBe(12000)
    expect(video.phases.find((phase) => phase.name === "reveal")?.duration).toBeGreaterThan(text.phases.find((phase) => phase.name === "reveal")?.duration ?? 0)
  })

  it("collapses non-essential transitions for reduced motion", () => {
    const plan = createTimelinePlan({ contentType: "video", reducedMotion: true })

    expect(plan.totalDuration).toBe(0)
    expect(plan.phases).toHaveLength(4)
    expect(getTimelinePhase(plan, 0)).toBe("exit")
  })

  it("resolves phases deterministically", () => {
    const plan = createTimelinePlan({ contentType: "text" })

    expect(getTimelinePhase(plan, 0)).toBe("entry")
    expect(getTimelinePhase(plan, 500)).toBe("reveal")
    expect(getTimelinePhase(plan, 4000)).toBe("reaction")
    expect(getTimelinePhase(plan, 5000)).toBe("exit")
  })
})
