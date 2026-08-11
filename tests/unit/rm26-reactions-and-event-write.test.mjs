import assert from "node:assert/strict"
import { test } from "node:test"

import {
  REACTION_GUEST_COOKIE_VERSION,
  resolveReactionActor,
} from "../../src/features/reactions/guest-identity.ts"
import {
  ALLOWED_REACTION_EMOJIS,
  isAllowedReactionEmoji,
} from "../../src/features/reactions/emoji.ts"
import { applyEventScheduleWrite } from "../../src/features/events/write-contract.ts"

const secrets = {
  current: "current-reaction-secret-012345678901234567890123456789",
  previous: "previous-reaction-secret-012345678901234567890123456789",
}

test("authenticated actors never receive a guest identity", () => {
  assert.deepEqual(
    resolveReactionActor({
      authenticatedUserId: "7d7a1dd4-cf5e-4ed9-8df4-d48edb3a3f20",
      secrets,
    }),
    {
      actorId: "7d7a1dd4-cf5e-4ed9-8df4-d48edb3a3f20",
      actorKeyHash: null,
    },
  )
})

test("guest cookies are signed, tamper-resistant, expiring, and rotatable", () => {
  const issuedAt = Date.UTC(2026, 7, 11, 3, 0, 0)
  const issued = resolveReactionActor({ secrets, nowMs: issuedAt })
  assert.ok(issued.cookieValue?.startsWith(REACTION_GUEST_COOKIE_VERSION + "."))

  const verified = resolveReactionActor({
    cookieValue: issued.cookieValue,
    secrets,
    nowMs: issuedAt + 1000,
    persistGuestCookie: false,
  })
  assert.equal(verified.actorKeyHash, issued.actorKeyHash)

  const tampered = resolveReactionActor({
    cookieValue: issued.cookieValue + "x",
    secrets,
    nowMs: issuedAt + 1000,
    persistGuestCookie: false,
  })
  assert.equal(tampered.actorKeyHash, null)

  const expired = resolveReactionActor({
    cookieValue: issued.cookieValue,
    secrets,
    nowMs: issuedAt + 31 * 24 * 60 * 60 * 1000,
    persistGuestCookie: false,
  })
  assert.equal(expired.actorKeyHash, null)

  const previousIssued = resolveReactionActor({ secrets: { current: secrets.previous }, nowMs: issuedAt })
  const rotated = resolveReactionActor({
    cookieValue: previousIssued.cookieValue,
    secrets,
    nowMs: issuedAt + 1000,
  })
  assert.equal(rotated.actorKeyHash, previousIssued.actorKeyHash)
  assert.notEqual(rotated.cookieValue, previousIssued.cookieValue)
})

test("emoji validation accepts only the canonical Unicode contract", () => {
  assert.equal(ALLOWED_REACTION_EMOJIS.length, 6)
  for (const emoji of ALLOWED_REACTION_EMOJIS) assert.equal(isAllowedReactionEmoji(emoji), true)
  assert.equal(isAllowedReactionEmoji("❤"), false)
  assert.equal(isAllowedReactionEmoji("👍🏻"), false)
  assert.equal(isAllowedReactionEmoji("heart"), false)
})

test("missing schedule fields do not create implicit event null writes", () => {
  const base = { title: "Updated title", visibility: "unlisted" }
  const result = applyEventScheduleWrite(base, {
    starts_at: null,
    ends_at: null,
    timezone: "UTC",
    location_name: null,
    location_address: null,
    host_name: null,
    host_title: null,
    clear: false,
    provided: false,
  })
  assert.deepEqual(result, base)
  assert.equal("event_date" in result, false)
})

test("only explicit clear semantics remove the legacy event date", () => {
  const result = applyEventScheduleWrite({ title: "Updated title" }, {
    starts_at: null,
    ends_at: null,
    timezone: "UTC",
    location_name: null,
    location_address: null,
    host_name: null,
    host_title: null,
    clear: true,
    provided: true,
  })
  assert.equal(result.event_date, null)
  assert.equal(result.starts_at, null)
})