import { describe, expect, it } from "vitest"

import { formatPosterDate, getPosterDimensions, wrapPosterText } from "./spike"

describe("poster renderer spike contract", () => {
  it("keeps the MVP poster dimensions stable for both ratios", () => {
    expect(getPosterDimensions("4:5")).toEqual({ width: 1080, height: 1350 })
    expect(getPosterDimensions("9:16")).toEqual({ width: 1080, height: 1920 })
  })

  it("wraps Vietnamese text without producing an empty line", () => {
    const lines = wrapPosterText("Lễ tốt nghiệp Khoa Công nghệ thông tin", 18)

    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((line) => line.length <= 18)).toBe(true)
    expect(lines).not.toContain("")
  })

  it("formats a date for the poster without relying on a provider", () => {
    expect(formatPosterDate("2026-08-05")).toBe("05/08/2026")
    expect(formatPosterDate("invalid-date")).toBe("invalid-date")
  })
})
