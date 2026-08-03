import { describe, expect, it } from "vitest"

import {
  draftStorageKey,
  parseStoredWishDraft,
  serializeWishDraft,
  validateSenderName,
  validateWishContent,
  wishDraftReducer,
  WISH_DRAFT_VERSION,
} from "./draft"

const requestId = "11111111-1111-4111-8111-111111111111"
const nextRequestId = "22222222-2222-4222-8222-222222222222"

describe("wish draft lifecycle", () => {
  it("restores content and keeps the same request id for retries", () => {
    const stored = JSON.stringify({
      version: WISH_DRAFT_VERSION,
      content: "Bản nháp",
      senderName: "Minh",
      clientRequestId: requestId,
      deviceKey: "",
    })

    expect(parseStoredWishDraft(stored, nextRequestId, "device-key")).toEqual({
      content: "Bản nháp",
      senderName: "Minh",
      clientRequestId: requestId,
      deviceKey: "device-key",
    })
  })

  it("rotates request id only when a new draft begins", () => {
    const state = {
      content: "Lời chúc",
      senderName: "Khách",
      clientRequestId: requestId,
      deviceKey: "device-key",
    }

    expect(
      wishDraftReducer(state, {
        type: "content",
        value: "Lời chúc đã sửa",
      }).clientRequestId
    ).toBe(requestId)

    expect(
      wishDraftReducer(state, {
        type: "newDraft",
        clientRequestId: nextRequestId,
      })
    ).toEqual({
      content: "",
      senderName: "",
      clientRequestId: nextRequestId,
      deviceKey: "device-key",
    })
  })

  it("serializes no device identifier into the event draft", () => {
    const serialized = serializeWishDraft({
      content: "Chúc mừng",
      senderName: "Guest",
      clientRequestId: requestId,
      deviceKey: "private-device-key",
    })

    expect(serialized.deviceKey).toBe("")
    expect(draftStorageKey("event-id")).toContain("event-id")
  })

  it("matches server text, sender, and URL limits", () => {
    expect(validateWishContent("", 1000)).toBeTruthy()
    expect(validateWishContent("x".repeat(1001), 1000)).toBeTruthy()
    expect(
      validateWishContent(
        "https://one.test https://two.test https://three.test",
        1000
      )
    ).toBeTruthy()
    expect(validateWishContent("Chúc mừng!", 1000)).toBeNull()
    expect(validateSenderName("")).toBeTruthy()
    expect(validateSenderName("Guest")).toBeNull()
  })
})
