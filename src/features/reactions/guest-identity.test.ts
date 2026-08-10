import { describe, expect, it } from "vitest"

import {
  ALLOWED_REACTION_EMOJIS,
  isAllowedReactionEmoji,
} from "./emoji"
import {
  REACTION_GUEST_COOKIE_MAX_AGE_SECONDS,
  resolveReactionActor,
} from "./guest-identity"

const nowMs = 1_725_000_000_000
const currentSecret = "current-reaction-secret-for-unit-tests"
const previousSecret = "previous-reaction-secret-for-unit-tests"

describe("reaction guest identity", () => {
  it("uses the authenticated user without issuing a guest identity", () => {
    expect(
      resolveReactionActor({ authenticatedUserId: "user-123" }),
    ).toEqual({ actorId: "user-123", actorKeyHash: null })
  })

  it("issues and verifies a versioned guest cookie", () => {
    const issued = resolveReactionActor({
      secrets: { current: currentSecret },
      nowMs,
    })

    expect(issued.actorId).toBeNull()
    expect(issued.actorKeyHash).toMatch(/^[a-f0-9]{64}$/)
    expect(issued.cookieValue).toMatch(/^v1\./)

    expect(
      resolveReactionActor({
        cookieValue: issued.cookieValue,
        secrets: { current: currentSecret },
        nowMs: nowMs + 1_000,
        persistGuestCookie: false,
      }),
    ).toEqual({ actorId: null, actorKeyHash: issued.actorKeyHash })
  })

  it("does not accept tampered, expired, or unknown-version cookies as the old actor", () => {
    const issued = resolveReactionActor({
      secrets: { current: currentSecret },
      nowMs,
    })
    const tampered = `${issued.cookieValue!.slice(0, -1)}0`
    const wrongVersion = issued.cookieValue!.replace(/^v1\./, "v2.")

    for (const cookieValue of [tampered, wrongVersion]) {
      expect(
        resolveReactionActor({
          cookieValue,
          secrets: { current: currentSecret },
          nowMs,
          persistGuestCookie: false,
        }),
      ).toEqual({ actorId: null, actorKeyHash: null })
    }

    expect(
      resolveReactionActor({
        cookieValue: issued.cookieValue,
        secrets: { current: currentSecret },
        nowMs: nowMs + (REACTION_GUEST_COOKIE_MAX_AGE_SECONDS + 1) * 1_000,
        persistGuestCookie: false,
      }),
    ).toEqual({ actorId: null, actorKeyHash: null })
  })

  it("re-signs a valid previous-secret cookie without changing its actor hash", () => {
    const issuedWithPreviousSecret = resolveReactionActor({
      secrets: { current: previousSecret },
      nowMs,
    })
    const rotated = resolveReactionActor({
      cookieValue: issuedWithPreviousSecret.cookieValue,
      secrets: { current: currentSecret, previous: previousSecret },
      nowMs: nowMs + 1_000,
    })

    expect(rotated.actorKeyHash).toBe(issuedWithPreviousSecret.actorKeyHash)
    expect(rotated.cookieValue).toMatch(/^v1\./)
    expect(
      resolveReactionActor({
        cookieValue: rotated.cookieValue,
        secrets: { current: currentSecret },
        nowMs: nowMs + 2_000,
        persistGuestCookie: false,
      }),
    ).toEqual({ actorId: null, actorKeyHash: issuedWithPreviousSecret.actorKeyHash })
  })
})

describe("reaction emoji contract", () => {
  it("uses one canonical Unicode allowlist and rejects look-alikes", () => {
    expect(ALLOWED_REACTION_EMOJIS).toEqual(["❤️", "👍", "🎉", "😂", "🔥", "👏"])
    expect(isAllowedReactionEmoji("❤️")).toBe(true)
    expect(isAllowedReactionEmoji("❤")).toBe(false)
    expect(isAllowedReactionEmoji("👍🏻")).toBe(false)
    expect(isAllowedReactionEmoji("not-an-emoji")).toBe(false)
  })
})
