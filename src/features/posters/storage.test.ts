import { describe, expect, it } from "vitest"

import {
  detectPosterAssetMime,
  posterAssetPath,
  validatePosterAssetUpload,
} from "./storage"

const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
const webpBytes = Uint8Array.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")])

describe("poster storage contract", () => {
  it("builds a UUID-only private asset path", () => {
    expect(posterAssetPath({
      eventId: "00000000-0000-4000-8000-000000000001",
      documentId: "00000000-0000-4000-8000-000000000002",
      assetId: "00000000-0000-4000-8000-000000000003",
      mimeType: "image/png",
    })).toBe("00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-000000000003.png")
  })

  it("detects supported raster magic bytes", () => {
    expect(detectPosterAssetMime(pngBytes)).toBe("image/png")
    expect(detectPosterAssetMime(jpegBytes)).toBe("image/jpeg")
    expect(detectPosterAssetMime(webpBytes)).toBe("image/webp")
  })

  it("rejects MIME and magic-byte mismatches", () => {
    expect(validatePosterAssetUpload({
      bytes: pngBytes,
      declaredMimeType: "image/jpeg",
    })).toMatchObject({
      success: false,
      issues: ["declared MIME type does not match image magic bytes"],
    })
  })
})
