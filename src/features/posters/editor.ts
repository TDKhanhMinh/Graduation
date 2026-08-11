import { posterDocumentSchema, type PosterAsset, type PosterDocument, type PosterElement } from "./schema"

const MIN_VISIBLE_PIXELS = 24
const MIN_ELEMENT_SIZE = 24

export type PosterEditorState = {
  document: PosterDocument
  selectedIds: string[]
  past: PosterDocument[]
  future: PosterDocument[]
}

export type PosterEditorCommand =
  | { type: "move"; ids: string[]; dx: number; dy: number }
  | { type: "resize"; id: string; width: number; height: number }
  | { type: "rotate"; ids: string[]; degrees: number }
  | { type: "set-text"; id: string; text: string }
  | { type: "set-fill"; id: string; fill: string }
  | { type: "duplicate"; ids: string[] }
  | { type: "group"; ids: string[] }
  | { type: "ungroup"; id: string }
  | { type: "set-lock"; ids: string[]; locked: boolean }
  | { type: "set-z-index"; id: string; zIndex: number }
  | { type: "insert-asset"; asset: PosterAsset }
  | { type: "select"; ids: string[] }

export function createPosterEditorState(document: PosterDocument): PosterEditorState {
  return { document: posterDocumentSchema.parse(document), selectedIds: [], past: [], future: [] }
}

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360
}

export function clampPosterFrame(
  frame: PosterElement["frame"],
  dimensions: PosterDocument["dimensions"],
): PosterElement["frame"] {
  const width = Math.max(MIN_ELEMENT_SIZE, frame.width)
  const height = Math.max(MIN_ELEMENT_SIZE, frame.height)
  return {
    width,
    height,
    x: Math.min(dimensions.width - MIN_VISIBLE_PIXELS, Math.max(0, frame.x)),
    y: Math.min(dimensions.height - MIN_VISIBLE_PIXELS, Math.max(0, frame.y)),
  }
}

function withDocument(document: PosterDocument, patch: Partial<Pick<PosterDocument, "assets" | "elements">>) {
  return posterDocumentSchema.parse({
    ...document,
    ...patch,
    metadata: { ...document.metadata, updatedAt: new Date().toISOString() },
  })
}

function withElements(document: PosterDocument, elements: PosterElement[]) {
  return withDocument(document, { elements })
}

export function insertPosterAsset(document: PosterDocument, asset: PosterAsset) {
  if (document.assets.some((candidate) => candidate.id === asset.id)) return document
  const elementId = "asset-" + asset.id
  const isBackground = asset.kind === "background"
  const width = isBackground ? document.dimensions.width : Math.round(document.dimensions.width * 0.62)
  const height = isBackground ? document.dimensions.height : Math.round(document.dimensions.height * 0.42)
  const x = isBackground ? 0 : Math.round((document.dimensions.width - width) / 2)
  const y = isBackground ? 0 : Math.round((document.dimensions.height - height) / 2)
  const zIndex = Math.max(0, ...document.elements.map((element) => element.zIndex)) + 1
  const imageElement: PosterElement = {
    id: elementId,
    type: "image",
    frame: { x, y, width, height },
    locked: false,
    visible: true,
    zIndex,
    rotation: 0,
    assetId: asset.id,
    fit: isBackground ? "cover" : "contain",
    crop: { focalX: 0.5, focalY: 0.5, scale: 1 },
  }
  return withDocument(document, {
    assets: [...document.assets, asset],
    elements: [...document.elements, imageElement],
  })
}

function mapSelected(document: PosterDocument, ids: string[], mapper: (element: PosterElement) => PosterElement) {
  const selected = new Set(ids)
  return withElements(document, document.elements.map((element) => selected.has(element.id) && !element.locked ? mapper(element) : element))
}

export function movePosterElements(document: PosterDocument, ids: string[], dx: number, dy: number) {
  return mapSelected(document, ids, (element) => ({
    ...element,
    frame: clampPosterFrame({ ...element.frame, x: element.frame.x + dx, y: element.frame.y + dy }, document.dimensions),
  }))
}

export function resizePosterElement(document: PosterDocument, id: string, width: number, height: number) {
  return mapSelected(document, [id], (element) => ({
    ...element,
    frame: clampPosterFrame({ ...element.frame, width, height }, document.dimensions),
  }))
}

export function rotatePosterElements(document: PosterDocument, ids: string[], degrees: number) {
  return mapSelected(document, ids, (element) => ({ ...element, rotation: normalizeRotation(element.rotation + degrees) }))
}

export function duplicatePosterElements(document: PosterDocument, ids: string[]) {
  const selected = new Set(ids)
  const existing = new Set(document.elements.map((element) => element.id))
  const duplicates = document.elements.filter((element) => selected.has(element.id) && !element.locked).map((element) => {
    let copyId = element.id + "-copy"
    let index = 2
    while (existing.has(copyId)) copyId = element.id + "-copy-" + index++
    existing.add(copyId)
    return {
      ...element,
      id: copyId,
      frame: clampPosterFrame({ ...element.frame, x: element.frame.x + 24, y: element.frame.y + 24 }, document.dimensions),
    }
  })
  return withElements(document, [...document.elements, ...duplicates])
}

export function groupPosterElements(document: PosterDocument, ids: string[]) {
  const selected = document.elements.filter((element) => ids.includes(element.id) && !element.locked)
  if (selected.length < 2) return document
  const minX = Math.min(...selected.map((element) => element.frame.x))
  const minY = Math.min(...selected.map((element) => element.frame.y))
  const maxX = Math.max(...selected.map((element) => element.frame.x + element.frame.width))
  const maxY = Math.max(...selected.map((element) => element.frame.y + element.frame.height))
  const existing = new Set(document.elements.map((element) => element.id))
  let groupId = "group-" + selected.map((element) => element.id).join("-")
  let suffix = 2
  while (existing.has(groupId)) groupId = "group-" + (selected[0]?.id ?? "selection") + "-" + suffix++
  return withElements(document, [
    ...document.elements,
    {
      id: groupId,
      type: "group",
      childIds: selected.map((element) => element.id),
      frame: clampPosterFrame({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }, document.dimensions),
      locked: false,
      visible: true,
      zIndex: Math.max(...selected.map((element) => element.zIndex)) + 1,
      rotation: 0,
    },
  ])
}

export function ungroupPosterElement(document: PosterDocument, id: string) {
  const group = document.elements.find((element) => element.id === id && element.type === "group")
  if (!group || group.type !== "group") return document
  return withElements(document, document.elements.filter((element) => element.id !== group.id))
}

export function snapPosterDelta(value: number, grid = 8) {
  if (!Number.isFinite(value) || grid <= 0) return value
  return Math.round(value / grid) * grid
}

export function applyPosterEditorCommand(state: PosterEditorState, command: PosterEditorCommand): PosterEditorState {
  if (command.type === "select") return { ...state, selectedIds: command.ids.filter((id) => state.document.elements.some((element) => element.id === id)) }

  let nextDocument = state.document
  let nextSelection = state.selectedIds
  if (command.type === "move") nextDocument = movePosterElements(state.document, command.ids, command.dx, command.dy)
  if (command.type === "resize") nextDocument = resizePosterElement(state.document, command.id, command.width, command.height)
  if (command.type === "rotate") nextDocument = rotatePosterElements(state.document, command.ids, command.degrees)
  if (command.type === "set-text") nextDocument = mapSelected(state.document, [command.id], (element) => element.type === "text" ? { ...element, text: command.text } : element)
  if (command.type === "set-fill") nextDocument = mapSelected(state.document, [command.id], (element) => element.type === "text" ? { ...element, style: { ...element.style, fill: command.fill } } : element)
  if (command.type === "duplicate") {
    nextDocument = duplicatePosterElements(state.document, command.ids)
    nextSelection = nextDocument.elements.filter((element) => command.ids.some((id) => element.id.startsWith(id + "-copy"))).map((element) => element.id)
  }
  if (command.type === "group") {
    nextDocument = groupPosterElements(state.document, command.ids)
    nextSelection = nextDocument.elements.filter((element) => element.type === "group" && command.ids.every((id) => element.childIds.includes(id))).map((element) => element.id)
  }
  if (command.type === "ungroup") nextDocument = ungroupPosterElement(state.document, command.id)
  if (command.type === "set-lock") nextDocument = mapSelected(state.document, command.ids, (element) => ({ ...element, locked: command.locked }))
  if (command.type === "set-z-index") nextDocument = mapSelected(state.document, [command.id], (element) => ({ ...element, zIndex: Math.max(0, Math.round(command.zIndex)) }))
  if (command.type === "insert-asset") nextDocument = insertPosterAsset(state.document, command.asset)
  if (nextDocument === state.document) return state
  return { document: nextDocument, selectedIds: nextSelection, past: [...state.past, state.document], future: [] }
}

export function undoPosterEditor(state: PosterEditorState): PosterEditorState {
  const previous = state.past.at(-1)
  if (!previous) return state
  return { document: previous, selectedIds: state.selectedIds, past: state.past.slice(0, -1), future: [state.document, ...state.future] }
}

export function redoPosterEditor(state: PosterEditorState): PosterEditorState {
  const next = state.future[0]
  if (!next) return state
  return { document: next, selectedIds: next ? [...state.selectedIds] : state.selectedIds, past: [...state.past, state.document], future: state.future.slice(1) }
}

export function getPosterEditorCapabilities(viewportWidth: number) {
  return {
    quickCreate: true,
    advancedEditor: viewportWidth >= 768,
    touchHandles: viewportWidth >= 768,
  }
}