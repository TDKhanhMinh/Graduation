"use client"

import { Copy, Download, Group, Lock, Redo2, Save, Undo2, Ungroup, Unlock } from "lucide-react"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { toast } from "sonner"

import { savePosterDocument } from "@/app/dashboard/events/[id]/poster-studio/actions"
import { Button } from "@/components/ui/button"
import {
  applyPosterEditorCommand,
  createPosterEditorState,
  getPosterEditorCapabilities,
  redoPosterEditor,
  snapPosterDelta,
  undoPosterEditor,
  type PosterEditorState,
} from "@/features/posters/editor"
import { posterDocumentSchema, type PosterDocument, type PosterElement } from "@/features/posters/schema"

type PosterAdvancedEditorProps = {
  eventId: string
  initialDocument: PosterDocument
  initialRevision: number
}

type DragState = {
  ids: string[]
  startX: number
  startY: number
  dx: number
  dy: number
}

type DragPreview = {
  ids: string[]
  dx: number
  dy: number
}

const LOCAL_DRAFT_PREFIX = "memoria:poster-editor:"
const SAVE_DELAY_MS = 1200

function elementLabel(element: PosterElement) {
  if (element.type === "text") return element.text || element.id
  return element.type + " " + element.id
}

function visibleElements(document: PosterDocument) {
  return [...document.elements]
    .filter((element) => element.visible && element.type !== "group")
    .sort((left, right) => left.zIndex - right.zIndex)
}

function transformFor(element: PosterElement, dragPreview: DragPreview | null) {
  const offset = dragPreview?.ids.includes(element.id) ? dragPreview : null
  const x = element.frame.x + (offset?.dx ?? 0)
  const y = element.frame.y + (offset?.dy ?? 0)
  return "translate(" + x + " " + y + ") rotate(" + element.rotation + " " + element.frame.width / 2 + " " + element.frame.height / 2 + ")"
}

function renderPosterElement(element: PosterElement, dragPreview: DragPreview | null, qrDataUrl: string) {
  const transform = transformFor(element, dragPreview)
  if (element.type === "text") {
    const lines = element.text.trim() ? element.text.trim().split(/\s+/).reduce<string[]>((result, word) => {
      const current = result.at(-1) ?? ""
      const next = current ? current + " " + word : word
      if (next.length > Math.max(10, Math.floor(element.frame.width / Math.max(12, element.style.fontSize * 0.52)))) {
        result.push(word)
      } else if (result.length) {
        result[result.length - 1] = next
      } else {
        result.push(next)
      }
      return result
    }, []) : [element.id]
    const lineHeight = element.style.fontSize * element.style.lineHeight
    return (
      <g key={element.id} transform={transform}>
        <rect width={element.frame.width} height={element.frame.height} fill="transparent" pointerEvents="all" />
        <text
          y={element.style.fontSize}
          fontFamily={element.style.fontFamily}
          fontSize={element.style.fontSize}
          fontWeight={element.style.fontWeight}
          fill={element.style.fill}
          textAnchor={element.style.align === "center" ? "middle" : element.style.align === "right" ? "end" : "start"}
          x={element.style.align === "center" ? element.frame.width / 2 : element.style.align === "right" ? element.frame.width : 0}
        >
          {lines.slice(0, element.constraints.maxLines).map((line, index) => (
            <tspan key={index} x={element.style.align === "center" ? element.frame.width / 2 : element.style.align === "right" ? element.frame.width : 0} dy={index === 0 ? 0 : lineHeight}>{line}</tspan>
          ))}
        </text>
      </g>
    )
  }

  if (element.type === "image") {
    return (
      <g key={element.id} transform={transform}>
        <rect width={element.frame.width} height={element.frame.height} rx={24} fill="#d8c6b8" opacity="0.72" />
        <text x={element.frame.width / 2} y={element.frame.height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={24} fill="#4b3b43">{element.assetId ?? "asset"}</text>
      </g>
    )
  }

  if (element.type === "shape") {
    if (element.shape === "circle") {
      return <circle key={element.id} cx={element.frame.width / 2} cy={element.frame.height / 2} r={Math.min(element.frame.width, element.frame.height) / 2} fill={element.fill} opacity={element.opacity} transform={transform} />
    }
    return <rect key={element.id} width={element.frame.width} height={element.frame.height} fill={element.fill} opacity={element.opacity} transform={transform} />
  }

  if (element.type === "qr") {
    return (
      <g key={element.id} transform={transform}>
        <rect width={element.frame.width} height={element.frame.height} rx={16} fill={element.background} />
        {qrDataUrl ? <image href={qrDataUrl} x={element.quietZone * 4} y={element.quietZone * 4} width={element.frame.width - element.quietZone * 8} height={element.frame.height - element.quietZone * 8} preserveAspectRatio="none" /> : <rect x={element.quietZone * 4} y={element.quietZone * 4} width={element.frame.width - element.quietZone * 8} height={element.frame.height - element.quietZone * 8} fill="url(#poster-editor-qr-pattern)" />}
        <text x={element.frame.width / 2} y={element.frame.height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={24} fill={element.foreground} opacity={qrDataUrl ? 0 : 1}>QR</text>
      </g>
    )
  }

  return null
}

export function PosterAdvancedEditor({ eventId, initialDocument, initialRevision }: PosterAdvancedEditorProps) {
  const [editorState, setEditorState] = useState<PosterEditorState>(() => createPosterEditorState(initialDocument))
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [saveStatus, setSaveStatus] = useState<"local" | "saving" | "saved" | "conflict">("local")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [fontReady, setFontReady] = useState(false)
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "error">("idle")
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const revisionRef = useRef(initialRevision)
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capabilities = getPosterEditorCapabilities(1024)
  const storageKey = LOCAL_DRAFT_PREFIX + eventId

  const selectedElements = useMemo(
    () => editorState.document.elements.filter((element) => editorState.selectedIds.includes(element.id)),
    [editorState.document.elements, editorState.selectedIds],
  )
  const selectedElement = selectedElements[0]
  const dimensions = editorState.document.dimensions
  const exportReady = Boolean(qrDataUrl) && fontReady

  useEffect(() => {
    let cancelled = false
    void import("@/features/sharing/qr").then(({ createQrDataUrl }) => createQrDataUrl(editorState.document.content.publicUrl, 256)).then((value) => {
      if (!cancelled) setQrDataUrl(value)
    }).catch(() => {
      if (!cancelled) toast.error("Hiện chưa thể tạo mã QR.")
    })
    return () => { cancelled = true }
  }, [editorState.document.content.publicUrl])

  useEffect(() => {
    void globalThis.document.fonts.ready.then(() => setFontReady(true))
  }, [])

  useEffect(() => {
    let active = true
    const recoveryTimer = globalThis.setTimeout(() => {
      try {
        const raw = globalThis.localStorage.getItem(storageKey)
        if (raw) {
          const result = posterDocumentSchema.safeParse(JSON.parse(raw))
          if (active && result.success && result.data.metadata.eventId === eventId) {
            setEditorState(createPosterEditorState(result.data))
            toast.success("Đã khôi phục bản nháp cục bộ mới nhất.")
          }
        }
      } catch {
        if (active) toast.error("Không thể khôi phục bản nháp cục bộ; đang dùng tài liệu đã lưu.")
      } finally {
        if (active) hydratedRef.current = true
      }
    }, 0)
    return () => {
      active = false
      globalThis.clearTimeout(recoveryTimer)
    }
  }, [eventId, storageKey])

  useEffect(() => {
    if (!hydratedRef.current) return
    globalThis.localStorage.setItem(storageKey, JSON.stringify(editorState.document))
    setSaveStatus("saving")
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void savePosterDocument(eventId, editorState.document, revisionRef.current).then((result) => {
        if (result.success) {
          revisionRef.current = result.revision
          setSaveStatus("saved")
          toast.success("Đã tự động lưu tài liệu áp phích.", { id: "poster-autosave" })
        } else if (result.conflict) {
          setSaveStatus("conflict")
          toast.error("Một phiên khác đã thay đổi áp phích này. Hãy tải lại trước khi lưu tiếp.")
        } else {
          setSaveStatus("local")
          toast.info("Đã lưu cục bộ. Hệ thống sẽ thử lưu lên máy chủ lại khi có thể.")
        }
      })
    }, SAVE_DELAY_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [editorState.document, eventId, storageKey])

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
  }, [])

  function dispatch(command: Parameters<typeof applyPosterEditorCommand>[1]) {
    setEditorState((current) => applyPosterEditorCommand(current, command))
  }

  function selectElement(id: string, additive: boolean) {
    const ids = additive
      ? editorState.selectedIds.includes(id)
        ? editorState.selectedIds.filter((selectedId) => selectedId !== id)
        : [...editorState.selectedIds, id]
      : [id]
    dispatch({ type: "select", ids })
  }

  function handlePointerDown(event: PointerEvent<SVGElement>, element: PosterElement) {
    if (event.button !== 0) return
    event.preventDefault()
    selectElement(element.id, event.shiftKey)
    if (element.locked) return
    const ids = editorState.selectedIds.includes(element.id) ? editorState.selectedIds : [element.id]
    dragRef.current = { ids, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 }
  }

  useEffect(() => {
    function onPointerMove(event: globalThis.PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const canvas = document.querySelector("[data-poster-editor-canvas]")
      if (!(canvas instanceof SVGSVGElement)) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = dimensions.width / Math.max(1, rect.width)
      const scaleY = dimensions.height / Math.max(1, rect.height)
      drag.dx = snapPosterDelta((event.clientX - drag.startX) * scaleX)
      drag.dy = snapPosterDelta((event.clientY - drag.startY) * scaleY)
      setDragPreview({ ids: drag.ids, dx: drag.dx, dy: drag.dy })
    }

    function onPointerUp() {
      const drag = dragRef.current
      if (!drag) return
      if (drag.dx || drag.dy) dispatch({ type: "move", ids: drag.ids, dx: drag.dx, dy: drag.dy })
      dragRef.current = null
      setDragPreview(null)
    }

    globalThis.addEventListener("pointermove", onPointerMove)
    globalThis.addEventListener("pointerup", onPointerUp)
    return () => {
      globalThis.removeEventListener("pointermove", onPointerMove)
      globalThis.removeEventListener("pointerup", onPointerUp)
    }
  }, [dimensions.height, dimensions.width, editorState.selectedIds])

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const target = event.target
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault()
      if (event.shiftKey) setEditorState((current) => redoPosterEditor(current))
      else setEditorState((current) => undoPosterEditor(current))
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
      event.preventDefault()
      setEditorState((current) => redoPosterEditor(current))
      return
    }
    if (!selectedElements.length) return
    if (event.key === "ArrowLeft") dispatch({ type: "move", ids: editorState.selectedIds, dx: -8, dy: 0 })
    if (event.key === "ArrowRight") dispatch({ type: "move", ids: editorState.selectedIds, dx: 8, dy: 0 })
    if (event.key === "ArrowUp") dispatch({ type: "move", ids: editorState.selectedIds, dx: 0, dy: -8 })
    if (event.key === "ArrowDown") dispatch({ type: "move", ids: editorState.selectedIds, dx: 0, dy: 8 })
  }

  async function exportPng() {
    if (!svgRef.current || !exportReady) {
      toast.error("Đang chờ phông chữ và mã QR sẵn sàng để xuất.")
      return
    }
    setExportStatus("exporting")
    const width = editorState.document.dimensions.width
    const height = editorState.document.dimensions.height
    const svg = svgRef.current.cloneNode(true) as SVGSVGElement
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }))
    try {
      const image = new Image()
      image.decoding = "async"
      image.src = svgUrl
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("Không thể tải ảnh xuất SVG"))
      })
      const scale = 2
      const canvas = globalThis.document.createElement("canvas")
      canvas.width = width * scale
      canvas.height = height * scale
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Không có ngữ cảnh canvas")
      context.scale(scale, scale)
      context.drawImage(image, 0, 0, width, height)
      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!png) throw new Error("Xuất PNG thất bại")
      const title = editorState.document.content.title.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").toLowerCase() || "event"
      const downloadUrl = URL.createObjectURL(png)
      const anchor = globalThis.document.createElement("a")
      anchor.href = downloadUrl
      anchor.download = "memoria-advanced-" + title + ".png"
      anchor.click()
      URL.revokeObjectURL(downloadUrl)
      setExportStatus("idle")
      toast.success("Đã xuất PNG từ Trình biên tập nâng cao với kích thước " + canvas.width + " x " + canvas.height + ".")
    } catch {
      setExportStatus("error")
      toast.error("Xuất PNG từ Trình biên tập nâng cao thất bại. Vui lòng thử lại khi bản xem trước đã sẵn sàng.")
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }

  function renderStatus() {
    if (saveStatus === "saving") return "Đang lưu..."
    if (saveStatus === "saved") return "Đã lưu"
    if (saveStatus === "conflict") return "Xung đột — cần tải lại"
    return "Bản nháp cục bộ"
  }

  return (
    <section className="hidden space-y-5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm md:block sm:p-6" aria-labelledby="poster-advanced-editor">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="lg:max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Trình biên tập nâng cao</p>
          <h2 id="poster-advanced-editor" className="mt-1 font-heading text-xl font-semibold">Tùy chỉnh chi tiết trên máy tính bảng hoặc máy tính để bàn</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Chọn, di chuyển, thay đổi kích thước, xoay, nhóm và phân lớp các thành phần trong khi vẫn bảo toàn phiên bản tài liệu áp phích. Thiết bị di động sử dụng tính năng Tạo nhanh.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground" role="status" aria-live="polite">
          <Save className="size-4" aria-hidden="true" />
          {renderStatus()}
          <span className="sr-only">Phông chữ {fontReady ? "sẵn sàng" : "đang tải"}, QR {qrDataUrl ? "sẵn sàng" : "đang tải"}</span>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 rounded-2xl border border-border/80 bg-surface-sunken p-3 sm:p-5">
          <div className="mx-auto w-full max-w-[54rem] overflow-auto rounded-xl border border-border/80 bg-[#1e1727] p-3" data-poster-editor-canvas-wrapper>
            <svg
              ref={svgRef}
              data-poster-editor-canvas
              viewBox={"0 0 " + dimensions.width + " " + dimensions.height}
              role="application"
              aria-label="Vùng chỉnh sửa áp phích nâng cao"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="mx-auto block h-auto max-h-[72vh] w-full outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <defs>
                <pattern id="poster-editor-qr-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <rect width="16" height="16" fill="#111827" />
                  <rect width="8" height="8" fill="#ffffff" />
                  <rect x="8" y="8" width="8" height="8" fill="#ffffff" />
                </pattern>
              </defs>
              <rect width={dimensions.width} height={dimensions.height} fill="#fffaf4" />
              {visibleElements(editorState.document).map((element) => (
                <g key={element.id} onPointerDown={(event) => handlePointerDown(event, element)} aria-label={elementLabel(element)}>
                  {renderPosterElement(element, dragPreview, qrDataUrl)}
                  {editorState.selectedIds.includes(element.id) ? <rect x={element.frame.x} y={element.frame.y} width={element.frame.width} height={element.frame.height} fill="none" stroke="#c85b45" strokeWidth={6} strokeDasharray="14 10" pointerEvents="none" /> : null}
                </g>
              ))}
              {editorState.document.elements.filter((element) => element.type === "group" && editorState.selectedIds.includes(element.id)).map((element) => (
                <rect key={element.id} x={element.frame.x} y={element.frame.y} width={element.frame.width} height={element.frame.height} fill="none" stroke="#7c3aed" strokeWidth={6} strokeDasharray="18 12" pointerEvents="none" />
              ))}
            </svg>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Giữ Shift và nhấp để chọn nhiều. Kéo bằng con trỏ hoặc dùng phím mũi tên để di chuyển theo lưới. Ctrl/Cmd+Z và Ctrl/Cmd+Y dùng để điều khiển lịch sử chỉnh sửa.</p>
        </div>

        <aside className="min-w-0 space-y-4 rounded-2xl border border-border/80 bg-background p-4" aria-label="Thuộc tính trình chỉnh sửa">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => void exportPng()} disabled={!exportReady || exportStatus === "exporting"}><Download className="size-4" />{exportStatus === "exporting" ? "Đang xuất..." : "Xuất PNG"}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditorState((current) => undoPosterEditor(current))} disabled={!editorState.past.length} aria-label="Hoàn tác"><Undo2 className="size-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditorState((current) => redoPosterEditor(current))} disabled={!editorState.future.length} aria-label="Làm lại"><Redo2 className="size-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => selectedElements.length ? dispatch({ type: "duplicate", ids: editorState.selectedIds }) : undefined} disabled={!selectedElements.length} aria-label="Nhân bản lựa chọn"><Copy className="size-4" /></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => selectedElements.length > 1 ? dispatch({ type: "group", ids: editorState.selectedIds }) : undefined} disabled={selectedElements.length < 2} aria-label="Nhóm lựa chọn"><Group className="size-4" /></Button>
          </div>

          {selectedElement ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Đã chọn</p>
                <p className="mt-1 truncate text-sm font-semibold">{elementLabel(selectedElement)}</p>
              </div>
              {selectedElement.type === "text" ? (
                <>
                  <label className="grid gap-1 text-xs font-medium" htmlFor="poster-editor-text">Nội dung
                    <textarea id="poster-editor-text" value={selectedElement.text} onChange={(event) => dispatch({ type: "set-text", id: selectedElement.id, text: event.target.value })} rows={4} maxLength={500} className="rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium" htmlFor="poster-editor-fill">Màu chữ
                    <input id="poster-editor-fill" type="color" value={selectedElement.style.fill.startsWith("#") && selectedElement.style.fill.length === 7 ? selectedElement.style.fill : "#111827"} onChange={(event) => dispatch({ type: "set-fill", id: selectedElement.id, fill: event.target.value })} className="h-9 w-full rounded-lg border border-input bg-background p-1" />
                  </label>
                </>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-medium" htmlFor="poster-editor-width">Chiều rộng
                  <input id="poster-editor-width" type="number" min={24} value={Math.round(selectedElement.frame.width)} onChange={(event) => dispatch({ type: "resize", id: selectedElement.id, width: Number(event.target.value), height: selectedElement.frame.height })} className="min-h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                </label>
                <label className="grid gap-1 text-xs font-medium" htmlFor="poster-editor-height">Chiều cao
                  <input id="poster-editor-height" type="number" min={24} value={Math.round(selectedElement.frame.height)} onChange={(event) => dispatch({ type: "resize", id: selectedElement.id, width: selectedElement.frame.width, height: Number(event.target.value) })} className="min-h-9 rounded-lg border border-input bg-background px-2 text-sm" />
                </label>
              </div>
              <label className="grid gap-1 text-xs font-medium" htmlFor="poster-editor-rotation">Góc xoay
                <input id="poster-editor-rotation" type="number" value={Math.round(selectedElement.rotation)} onChange={(event) => dispatch({ type: "rotate", ids: [selectedElement.id], degrees: Number(event.target.value) - selectedElement.rotation })} className="min-h-9 rounded-lg border border-input bg-background px-2 text-sm" />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "set-lock", ids: [selectedElement.id], locked: !selectedElement.locked })}>
                  {selectedElement.locked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                  {selectedElement.locked ? "Mở khóa" : "Khóa"}
                </Button>
                {selectedElement.type === "group" ? <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "ungroup", id: selectedElement.id })}><Ungroup className="size-4" />Bỏ nhóm</Button> : null}
                <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "set-z-index", id: selectedElement.id, zIndex: selectedElement.zIndex + 1 })}>Đưa lên trước</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">Chọn một thành phần để chỉnh thuộc tính. Thành phần bị khóa vẫn hiển thị nhưng không thể thay đổi.</p>
          )}

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
            <p>Khả năng: {capabilities.advancedEditor ? "Trình chỉnh sửa nâng cao" : "Tạo nhanh"}</p>
            <p>Phiên bản tài liệu: {editorState.document.version}</p>
            <p>Thành phần: {editorState.document.elements.length}</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
