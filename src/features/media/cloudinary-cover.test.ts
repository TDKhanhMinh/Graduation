import { describe, expect, it } from "vitest"

import {
  CLOUDINARY_COVER_MAX_BYTES,
  getCloudinaryCoverUploadConfig,
  isCloudinaryDeliveryUrl,
  parseCloudinaryCoverUploadResponse,
  validateCloudinaryCoverFile,
} from "./cloudinary-cover"

describe("cloudinary cover contract", () => {
  it("accepts only Cloudinary HTTPS delivery URLs", () => {
    expect(isCloudinaryDeliveryUrl("https://res.cloudinary.com/demo/image/upload/cover.webp")).toBe(true)
    expect(isCloudinaryDeliveryUrl("http://res.cloudinary.com/demo/image/upload/cover.webp")).toBe(false)
    expect(isCloudinaryDeliveryUrl("https://example.com/cover.webp")).toBe(false)
  })

  it("validates supported image types and the 5 MB limit", () => {
    expect(validateCloudinaryCoverFile({ type: "image/jpeg", size: 1024 })).toBeNull()
    expect(validateCloudinaryCoverFile({ type: "image/gif", size: 1024 })).toContain("JPEG")
    expect(validateCloudinaryCoverFile({ type: "image/png", size: CLOUDINARY_COVER_MAX_BYTES + 1 })).toContain("5 MB")
  })

  it("normalizes the Cloudinary upload response without requiring metadata", () => {
    expect(parseCloudinaryCoverUploadResponse({
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/cover.webp",
      public_id: "event-covers/cover",
      asset_id: "asset-1",
      version: 1,
      bytes: 2048,
      width: 1200,
      height: 800,
    })).toEqual({
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/cover.webp",
      publicId: "event-covers/cover",
      assetId: "asset-1",
      version: 1,
      format: null,
      bytes: 2048,
      width: 1200,
      height: 800,
    })
  })

  it("rejects a response without a valid URL bảo mật", () => {
    expect(() => parseCloudinaryCoverUploadResponse({ secure_url: "https://example.com/cover.webp" })).toThrow("URL bảo mật")
  })

  it("builds the upload endpoint from public configuration", () => {
    const previousCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const previousPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo cloud"
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "cover-preset"

    expect(getCloudinaryCoverUploadConfig()).toEqual({
      cloudName: "demo cloud",
      uploadPreset: "cover-preset",
      uploadUrl: "https://api.cloudinary.com/v1_1/demo%20cloud/image/upload",
    })

    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = previousCloudName
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = previousPreset
  })
})
