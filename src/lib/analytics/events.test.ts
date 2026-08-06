import { describe, expect, it } from "vitest"

import { isSafeAnalyticsPayload, resetAnalyticsDedupeForTests, track } from "./events"

describe("analytics event contract", () => {
  it("rejects PII and private payload keys", () => {
    expect(isSafeAnalyticsPayload({ variant: "hero", email: "private@example.com" })).toBe(false)
    expect(isSafeAnalyticsPayload({ variant: "hero", section: "faq" })).toBe(true)
  })

  it("is a no-op when provider or consent is unavailable", () => {
    resetAnalyticsDedupeForTests()
    expect(track("landing_visit", { source: "landing" }, { dedupeKey: "visit" })).toBe(false)
  })
})
