import { describe, expect, it } from "vitest"

import { createPosterDocumentFromQuickCreate } from "./quick-create"

const baseInput = {
  eventId: "event-1",
  eventCategory: "graduation" as const,
  templateId: "graduation-glow-01",
  ratio: "4:5" as const,
  title: "Lễ tốt nghiệp khóa 2026",
  tagline: "Một ngày đáng nhớ",
  date: "2026-08-05",
  location: "Memoria Hall",
  publicUrl: "https://example.com/e/memoria",
  accent: "#c85b45",
}

describe("poster quick create mapping", () => {
  it("maps form data into a versioned document without an uploaded image", () => {
    const document = createPosterDocumentFromQuickCreate({ ...baseInput, tagline: "", location: "" })
    const title = document.elements.find((element) => element.id === "title")

    expect(document.templateId).toBe("graduation-glow-01")
    expect(document.metadata.eventId).toBe("event-1")
    expect(document.content.tagline).toBe("")
    expect(document.content.location).toBe("")
    expect(title).toMatchObject({ type: "text", text: "Lễ tốt nghiệp khóa 2026" })
  })

  it("preserves a long Vietnamese title for renderer auto-fit", () => {
    const document = createPosterDocumentFromQuickCreate({
      ...baseInput,
      ratio: "9:16",
      templateId: "editorial-night-01",
      title: "Lễ kỷ niệm tốt nghiệp và những khoảnh khắc đáng nhớ cùng Memoria",
    })

    expect(document.ratio).toBe("9:16")
    expect(document.dimensions).toEqual({ width: 1080, height: 1920 })
    expect(document.elements.find((element) => element.id === "title")).toMatchObject({
      type: "text",
      text: "Lễ kỷ niệm tốt nghiệp và những khoảnh khắc đáng nhớ cùng Memoria",
    })
  })

  it("rejects an unknown local template", () => {
    expect(() => createPosterDocumentFromQuickCreate({
      ...baseInput,
      templateId: "remote-template",
    })).toThrow("Unknown local poster template")
  })
})

