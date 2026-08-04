import { describe, expect, it } from "vitest"

import { buildQrFilename, createQrDataUrl } from "./qr"

import {
  buildPublicEventUrl,
  resolvePublicEventUrl,
} from "./public-url"

describe("buildPublicEventUrl", () => {
  it("builds a canonical URL without a trailing slash", () => {
    expect(buildPublicEventUrl("https://memoria.example/", "graduation-2026")).toBe(
      "https://memoria.example/e/graduation-2026",
    )
  })

  it("preserves a configured base path", () => {
    expect(buildPublicEventUrl("https://memoria.example/app/", "event-1")).toBe(
      "https://memoria.example/app/e/event-1",
    )
  })

  it("rejects invalid base URLs and slugs", () => {
    expect(resolvePublicEventUrl("not-a-url", "event-1")).toEqual({
      ok: false,
      error: "Không thể tạo liên kết công khai cho sự kiện này.",
    })
    expect(resolvePublicEventUrl("https://memoria.example", "event/with-private-data")).toEqual({
      ok: false,
      error: "Không thể tạo liên kết công khai cho sự kiện này.",
    })
  })

  it("does not accept query strings or fragments in the base URL", () => {
    expect(() => buildPublicEventUrl("https://memoria.example?internal=1", "event-1")).toThrow(
      "Không thể tạo liên kết công khai cho sự kiện này.",
    )
  })

  it("keeps private identifiers out of the payload", () => {
    const url = buildPublicEventUrl("https://memoria.example", "event-1")

    expect(url).toBe("https://memoria.example/e/event-1")
    expect(url).not.toContain("owner-id")
    expect(url).not.toContain("event-id")
  })
})
describe("QR sharing helpers", () => {
  it("generates a PNG data URL for a public event URL", async () => {
    const dataUrl = await createQrDataUrl("https://memoria.example/e/event-1", 128)

    expect(dataUrl).toMatch(/^data:image\/png;base64,/)
  })

  it("creates a safe, deterministic QR filename", () => {
    expect(buildQrFilename("Lễ tốt nghiệp / 2026", "event-1")).toBe(
      "memoria-le-tot-nghiep-2026-qr.png",
    )
  })
})