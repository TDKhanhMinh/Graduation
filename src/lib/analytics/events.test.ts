import { describe, expect, it } from "vitest"

import {
  WELCOME_ANALYTICS_EVENTS,
  isSafeAnalyticsPayload,
  resetAnalyticsDedupeForTests,
  track,
} from "./events"

describe("analytics event contract", () => {
  it("rejects PII and private payload keys", () => {
    expect(isSafeAnalyticsPayload({ variant: "hero", email: "private@example.com" })).toBe(false)
    expect(isSafeAnalyticsPayload({ variant: "hero", section: "faq" })).toBe(true)
    expect(isSafeAnalyticsPayload({ variant: "hero", value: null })).toBe(true)
  })

  it("defines the bounded Welcome event contract", () => {
    expect(WELCOME_ANALYTICS_EVENTS).toEqual([
      "event_welcome_viewed",
      "event_welcome_submit_clicked",
      "event_welcome_explore_clicked",
      "event_welcome_scrolled",
      "event_welcome_deep_link_skipped",
    ])
  })

  it("is a no-op when provider or consent is unavailable", () => {
    resetAnalyticsDedupeForTests()
    expect(track("landing_visit", { source: "landing" }, { dedupeKey: "visit" })).toBe(false)
  })
})