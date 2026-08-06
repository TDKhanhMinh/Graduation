import { describe, expect, it } from "vitest"

import {
  filterPosterTemplateLibrary,
  posterTemplateLibrary,
  recordRecentPosterTemplate,
  togglePosterTemplateFavorite,
} from "./template-library"

describe("poster template library", () => {
  it("provides a local library with all post-MVP ratios", () => {
    expect(posterTemplateLibrary).toHaveLength(16)
    expect(posterTemplateLibrary.every((template) => template.supportedRatios.includes("1:1") && template.supportedRatios.includes("16:9"))).toBe(true)
    expect(posterTemplateLibrary.every((template) => template.thumbnail.startsWith("local://"))).toBe(true)
  })

  it("filters without mutating saved template identity", () => {
    const originalId = posterTemplateLibrary[0]!.id
    const filtered = filterPosterTemplateLibrary(posterTemplateLibrary, { query: "aurora", ratio: "16:9" })

    expect(filtered.map((template) => template.id)).toEqual([originalId])
    expect(posterTemplateLibrary[0]!.id).toBe(originalId)
  })

  it("keeps favorite and recent state as UI-only lists", () => {
    const first = posterTemplateLibrary[0]!.id
    const second = posterTemplateLibrary[1]!.id
    expect(togglePosterTemplateFavorite([], first)).toEqual([first])
    expect(togglePosterTemplateFavorite([first], first)).toEqual([])
    expect(recordRecentPosterTemplate([first, second], first, 2)).toEqual([first, second])
  })
})

