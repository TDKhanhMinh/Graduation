import { describe, expect, it } from "vitest"

import {
  POSTER_QR_MIN_SIZE,
  posterExportFilename,
  validateCanonicalPosterUrl,
  validatePosterExportQuality,
} from "./quality"

const validInput = {
  ratio: "4:5" as const,
  publicUrl: "https://memoria.example/e/graduation-2026",
  fontReady: true,
  assetsReady: true,
  safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
  qr: { x: 810, y: 1080, size: 190 },
}

describe("poster export quality gates", () => {
  it("accepts the canonical public URL and rejects private/query URLs", () => {
    expect(validateCanonicalPosterUrl(validInput.publicUrl)).toBe(true)
    expect(validateCanonicalPosterUrl("https://memoria.example/e/event?owner_id=secret")).toBe(false)
    expect(validateCanonicalPosterUrl("https://memoria.example/dashboard/events/event-1")).toBe(false)
  })

  it("accepts a safe QR and exact ratio dimensions", () => {
    const result = validatePosterExportQuality(validInput)
    expect(result).toMatchObject({ success: true, dimensions: { width: 1080, height: 1350 }, scale: 2 })
  })

  it("blocks pending assets, too-small QR and unsafe placement", () => {
    const result = validatePosterExportQuality({
      ...validInput,
      fontReady: false,
      assetsReady: false,
      qr: { x: 0, y: 0, size: POSTER_QR_MIN_SIZE - 1 },
    })
    expect(result.success).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([
      "Phông chữ chưa sẵn sàng",
      "Một hoặc nhiều thành phần áp phích chưa sẵn sàng",
      `QR must be at least ${POSTER_QR_MIN_SIZE}px`,
      "Mã QR nằm ngoài vùng an toàn của áp phích",
    ]))
  })

  it("creates a deterministic export filename", () => {
    expect(posterExportFilename("Lễ tốt nghiệp 2026", "9:16")).toBe("memoria-poster-le-tot-nghiep-2026-9-16.png")
  })
})

