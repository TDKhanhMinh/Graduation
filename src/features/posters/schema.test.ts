import { describe, expect, it } from "vitest"

import { graduationGlowTemplate } from "./templates"
import { migratePosterDocument } from "./migrations"
import {
  posterDocumentSchema,
  posterTextConstraintsSchema,
  resolvePosterEventCategory,
  validatePosterDocumentAgainstTemplate,
} from "./schema"

function makeDocument(overrides: Record<string, unknown> = {}) {
  const layout = graduationGlowTemplate.layouts["4:5"]

  return {
    version: 1,
    templateId: graduationGlowTemplate.id,
    templateVersion: graduationGlowTemplate.version,
    ratio: "4:5",
    dimensions: { width: 1080, height: 1350 },
    content: {
      title: "Lễ tốt nghiệp Khoa Công nghệ thông tin",
      tagline: "Một ngày đáng nhớ",
      date: "2026-08-05",
      location: "Memoria Hall",
      publicUrl: "https://example.com/e/graduation",
    },
    elements: layout.elements,
    assets: [],
    metadata: {
      eventId: "event-1",
      eventCategory: "graduation",
      createdAt: "2026-08-05T08:00:00+07:00",
      updatedAt: "2026-08-05T08:00:00+07:00",
    },
    ...overrides,
  }
}

describe("Poster Studio document contract", () => {
  it("rejects documents missing version, ratio, template reference or elements", () => {
    expect(posterDocumentSchema.safeParse({}).success).toBe(false)
    expect(posterDocumentSchema.safeParse(makeDocument({ version: undefined })).success).toBe(false)
    expect(posterDocumentSchema.safeParse(makeDocument({ ratio: undefined })).success).toBe(false)
    expect(posterDocumentSchema.safeParse(makeDocument({ templateId: undefined })).success).toBe(false)
    expect(posterDocumentSchema.safeParse(makeDocument({ elements: [] })).success).toBe(false)
  })

  it("validates the MVP template layouts and required elements", () => {
    const result = validatePosterDocumentAgainstTemplate(makeDocument(), graduationGlowTemplate)

    expect(result.success).toBe(true)
    expect(graduationGlowTemplate.supportedRatios).toEqual(["4:5", "9:16"])
    expect(graduationGlowTemplate.layouts["4:5"]).toBeDefined()
    expect(graduationGlowTemplate.layouts["9:16"]).toBeDefined()
  })

  it("keeps template version as a document snapshot instead of requiring latest source version", () => {
    const document = makeDocument({ templateVersion: 1 })
    const newerTemplate = { ...graduationGlowTemplate, version: 2 }
    const result = validatePosterDocumentAgainstTemplate(document, newerTemplate)

    expect(result.success).toBe(true)
    expect(document.templateVersion).toBe(1)
    expect(newerTemplate.version).toBe(2)
  })

  it("enforces text constraints and a deterministic current-event category mapping", () => {
    expect(posterTextConstraintsSchema.safeParse({ maxLines: 0, minFontSize: 12, maxFontSize: 48 }).success).toBe(false)
    expect(posterTextConstraintsSchema.safeParse({ maxLines: 3, minFontSize: 12, maxFontSize: 48 }).success).toBe(true)
    expect(resolvePosterEventCategory({ theme_key: "graduation", experience_preset: "minimal" })).toBe("graduation")
    expect(resolvePosterEventCategory({ theme_key: "minimal", experience_preset: "romantic" })).toBe("wedding")
    expect(resolvePosterEventCategory({ theme_key: "minimal", experience_preset: "minimal" })).toBe("general")
  })

  it("migrates the legacy v0 document into the versioned v1 contract", () => {
    const legacy = makeDocument({
      version: 0,
      templateVersion: undefined,
      content: undefined,
    })
    const migrated = migratePosterDocument(legacy)

    expect(migrated.version).toBe(1)
    expect(migrated.templateVersion).toBe(1)
    expect(migrated.content.title).toBe("Legacy poster")
    expect(migrated.content.publicUrl).toBe("https://example.com/e/legacy")
  })
})
