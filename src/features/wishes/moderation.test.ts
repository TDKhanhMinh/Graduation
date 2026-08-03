import { describe, expect, it } from "vitest"

import { bulkModerationSchema, moderationActions } from "./moderation-schema"

describe("moderation command schema", () => {
  it("accepts every controlled action", () => {
    for (const action of moderationActions) {
      expect(
        bulkModerationSchema.safeParse({
          wishIds: ["11111111-1111-4111-8111-111111111111"],
          action,
        }).success
      ).toBe(true)
    }
  })

  it("rejects empty, oversized, and malformed batches", () => {
    expect(
      bulkModerationSchema.safeParse({
        wishIds: [],
        action: "approve",
      }).success
    ).toBe(false)

    expect(
      bulkModerationSchema.safeParse({
        wishIds: Array.from(
          { length: 101 },
          () => "11111111-1111-4111-8111-111111111111"
        ),
        action: "approve",
      }).success
    ).toBe(false)

    expect(
      bulkModerationSchema.safeParse({
        wishIds: ["not-a-uuid"],
        action: "approve",
      }).success
    ).toBe(false)
  })

  it("validates optimistic version maps", () => {
    expect(
      bulkModerationSchema.safeParse({
        wishIds: ["11111111-1111-4111-8111-111111111111"],
        action: "approve",
        expectedVersions: {
          "11111111-1111-4111-8111-111111111111":
            "2026-07-31T00:00:00.000Z",
        },
      }).success
    ).toBe(true)
  })
})
