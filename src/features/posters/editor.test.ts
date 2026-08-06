import { describe, expect, it } from "vitest"

import { createPosterDocumentFromQuickCreate } from "./quick-create"
import {
  applyPosterEditorCommand,
  createPosterEditorState,
  getPosterEditorCapabilities,
  redoPosterEditor,
  snapPosterDelta,
  undoPosterEditor,
} from "./editor"

function makeState() {
  return createPosterEditorState(createPosterDocumentFromQuickCreate({
    eventId: "event-1",
    eventCategory: "graduation",
    templateId: "graduation-glow-01",
    ratio: "4:5",
    title: "Editor test",
    tagline: "",
    date: "",
    location: "",
    publicUrl: "https://example.com/e/editor",
    accent: "#c85b45",
  }))
}

describe("poster editor command boundary", () => {
  it("keeps moved/resized elements partially visible", () => {
    const state = makeState()
    const moved = applyPosterEditorCommand(state, { type: "move", ids: ["title"], dx: -5000, dy: -5000 })
    const resized = applyPosterEditorCommand(moved, { type: "resize", id: "title", width: 1, height: 1 })
    const element = resized.document.elements.find((item) => item.id === "title")!

    expect(element.frame.x).toBeGreaterThanOrEqual(0)
    expect(element.frame.y).toBeGreaterThanOrEqual(0)
    expect(element.frame.width).toBeGreaterThanOrEqual(24)
    expect(element.frame.height).toBeGreaterThanOrEqual(24)
  })

  it("supports duplicate, undo and redo without changing the original document", () => {
    const state = makeState()
    const duplicated = applyPosterEditorCommand(state, { type: "duplicate", ids: ["title"] })
    expect(duplicated.document.elements.some((element) => element.id === "title-copy")).toBe(true)
    expect(undoPosterEditor(duplicated).document.elements).toHaveLength(state.document.elements.length)
    expect(redoPosterEditor(undoPosterEditor(duplicated)).document.elements).toHaveLength(state.document.elements.length + 1)
    expect(state.document.elements.some((element) => element.id === "title-copy")).toBe(false)
  })

  it("supports text editing, locking, grouping and snap-grid movement", () => {
    const state = makeState()
    const edited = applyPosterEditorCommand(state, { type: "set-text", id: "title", text: "Updated title" })
    const grouped = applyPosterEditorCommand(edited, { type: "group", ids: ["title", "qr"] })
    const locked = applyPosterEditorCommand(grouped, { type: "set-lock", ids: ["title"], locked: true })
    const blockedMove = applyPosterEditorCommand(locked, { type: "move", ids: ["title"], dx: 80, dy: 80 })

    expect(blockedMove.document.elements.find((element) => element.id === "title")?.type).toBe("text")
    expect((blockedMove.document.elements.find((element) => element.id === "title") as Extract<typeof blockedMove.document.elements[number], { type: "text" }>).text).toBe("Updated title")
    expect(grouped.document.elements.some((element) => element.type === "group")).toBe(true)
    expect(snapPosterDelta(13)).toBe(16)
  })

  it("keeps advanced editor off on mobile", () => {
    expect(getPosterEditorCapabilities(390)).toEqual({ quickCreate: true, advancedEditor: false, touchHandles: false })
    expect(getPosterEditorCapabilities(1024)).toEqual({ quickCreate: true, advancedEditor: true, touchHandles: true })
  })
})