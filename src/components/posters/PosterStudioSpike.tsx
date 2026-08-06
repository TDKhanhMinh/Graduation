"use client"

import { Download, ImagePlus, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { createQrDataUrl } from "@/features/sharing/qr"
import {
  formatPosterDate,
  getPosterDimensions,
  type PosterDraft,
  type PosterRatio,
  wrapPosterText,
} from "@/features/posters/spike"

type PosterStudioSpikeProps = {
  eventTitle: string
  eventDate: string | null
  publicUrl: string
}

const DEFAULT_ACCENT = "#c85b45"

function PosterSvg({
  draft,
  qrDataUrl,
  svgRef,
}: {
  draft: PosterDraft
  qrDataUrl: string
  svgRef: React.RefObject<SVGSVGElement | null>
}) {
  const { width, height } = getPosterDimensions(draft.ratio)
  const titleLines = wrapPosterText(draft.title, draft.ratio === "4:5" ? 22 : 20).slice(0, 4)
  const titleStartY = draft.ratio === "4:5" ? 650 : 880
  const qrSize = draft.ratio === "4:5" ? 190 : 210
  const qrX = width - qrSize - 80
  const qrY = height - qrSize - 80

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Poster preview: ${draft.title || "Untitled event"}`}
      className="block h-full w-full"
    >
      <defs>
        <linearGradient id="poster-background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#241b2f" />
          <stop offset="58%" stopColor="#5d2d4a" />
          <stop offset="100%" stopColor={draft.accent} />
        </linearGradient>
        <radialGradient id="poster-glow" cx="78%" cy="18%" r="58%">
          <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
        <clipPath id="poster-image-clip">
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>

      <rect width={width} height={height} fill="url(#poster-background)" />
      {draft.imageDataUrl ? (
        <image
          href={draft.imageDataUrl}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          opacity="0.54"
          clipPath="url(#poster-image-clip)"
        />
      ) : null}
      <rect width={width} height={height} fill="#1c1228" opacity="0.28" />
      <rect width={width} height={height} fill="url(#poster-glow)" />
      <circle cx={width * 0.1} cy={height * 0.16} r={width * 0.18} fill="#f4b6a0" opacity="0.15" />
      <circle cx={width * 0.92} cy={height * 0.72} r={width * 0.2} fill={draft.accent} opacity="0.2" />

      <g fontFamily="Geist, Arial, sans-serif" fill="#fff9ef">
        <text x="80" y="120" fontSize="28" letterSpacing="8" fill="#f7d8ba">MEMORIA</text>
        <text x="80" y="190" fontSize="22" letterSpacing="4" fill="#fff9ef" opacity="0.78">A MOMENT TO REMEMBER</text>
        <text x="80" y={titleStartY} fontSize={draft.ratio === "4:5" ? 82 : 74} fontWeight="700">
          {titleLines.map((line, index) => (
            <tspan key={`${line}-${index}`} x="80" dy={index === 0 ? 0 : 96}>
              {line}
            </tspan>
          ))}
        </text>
        <text x="80" y={titleStartY + titleLines.length * 96 + 30} fontSize="30" fill="#f7d8ba">
          {draft.tagline || "Một ngày đáng nhớ"}
        </text>
        <line x1="80" y1={titleStartY + titleLines.length * 96 + 92} x2={width - 80} y2={titleStartY + titleLines.length * 96 + 92} stroke="#f7d8ba" strokeOpacity="0.5" />
        <text x="80" y={titleStartY + titleLines.length * 96 + 152} fontSize="34" fontWeight="600">
          {formatPosterDate(draft.date)}
        </text>
        <text x="80" y={titleStartY + titleLines.length * 96 + 208} fontSize="30" fill="#fff9ef" opacity="0.86">
          {draft.location || "Địa điểm sự kiện"}
        </text>
      </g>

      {qrDataUrl ? (
        <g transform={`translate(${qrX} ${qrY})`}>
          <rect width={qrSize} height={qrSize} rx="18" fill="#fffdf9" />
          <image href={qrDataUrl} x="18" y="18" width={qrSize - 36} height={qrSize - 36} />
        </g>
      ) : null}
      <text x="80" y={height - 92} fontFamily="Geist, Arial, sans-serif" fontSize="22" letterSpacing="3" fill="#fff9ef" opacity="0.7">
        SCAN TO JOIN THE MEMORY WALL
      </text>
    </svg>
  )
}

export function PosterStudioSpike({ eventTitle, eventDate, publicUrl }: PosterStudioSpikeProps) {
  const [ratio, setRatio] = useState<PosterRatio>("4:5")
  const [title, setTitle] = useState(eventTitle)
  const [tagline, setTagline] = useState("Một ngày đáng nhớ")
  const [date, setDate] = useState(eventDate?.slice(0, 10) ?? "")
  const [location, setLocation] = useState("Memoria Hall")
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [imageDataUrl, setImageDataUrl] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [fontReady, setFontReady] = useState(false)
  const [message, setMessage] = useState("")
  const svgRef = useRef<SVGSVGElement>(null)

  const draft = useMemo<PosterDraft>(() => ({
    ratio,
    title,
    tagline,
    date,
    location,
    accent,
    imageDataUrl,
  }), [accent, date, imageDataUrl, location, ratio, tagline, title])

  useEffect(() => {
    let cancelled = false
    void createQrDataUrl(publicUrl, 256).then((value) => {
      if (!cancelled) setQrDataUrl(value)
    }).catch(() => {
      if (!cancelled) setMessage("Không thể tạo QR lúc này.")
    })

    return () => {
      cancelled = true
    }
  }, [publicUrl])

  useEffect(() => {
    void document.fonts.ready.then(() => {
      setFontReady(true)
    })
  }, [])

  function handleImageChange(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn một file hình ảnh.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Ảnh spike bị giới hạn ở 8 MB; pipeline đầy đủ sẽ xử lý quota ở task sau.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === "string" ? reader.result : "")
      setMessage("Đã thay ảnh nền cho prototype.")
    }
    reader.onerror = () => setMessage("Không thể đọc ảnh đã chọn.")
    reader.readAsDataURL(file)
  }

  function resetDraft() {
    setTitle(eventTitle)
    setTagline("Một ngày đáng nhớ")
    setDate(eventDate?.slice(0, 10) ?? "")
    setLocation("Memoria Hall")
    setAccent(DEFAULT_ACCENT)
    setImageDataUrl("")
    setMessage("Đã reset về prototype mặc định.")
  }

  async function exportPng() {
    if (!svgRef.current) return
    setMessage("")

    if (document.fonts?.ready) await document.fonts.ready

    const { width, height } = getPosterDimensions(draft.ratio)
    const svg = svgRef.current.cloneNode(true) as SVGSVGElement
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink")
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    const serialized = new XMLSerializer().serializeToString(svg)
    const svgUrl = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml" }))

    try {
      const image = new Image()
      image.decoding = "async"
      image.src = svgUrl
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("SVG export image failed to load"))
      })

      const scale = 2
      const canvas = document.createElement("canvas")
      canvas.width = width * scale
      canvas.height = height * scale
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Canvas context unavailable")
      context.scale(scale, scale)
      context.drawImage(image, 0, 0, width, height)

      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!png) throw new Error("PNG export failed")

      const downloadUrl = URL.createObjectURL(png)
      const anchor = document.createElement("a")
      anchor.href = downloadUrl
      anchor.download = `memoria-poster-${draft.ratio.replace(":", "-")}.png`
      anchor.click()
      URL.revokeObjectURL(downloadUrl)
      setMessage(`Đã export PNG ${canvas.width} × ${canvas.height}.`)
    } catch {
      setMessage("Không thể export PNG; hãy thử lại sau khi font và ảnh đã sẵn sàng.")
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <section className="min-w-0 space-y-5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="poster-spike-controls">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Renderer spike</p>
          <h2 id="poster-spike-controls" className="mt-1 font-heading text-xl font-semibold">Quick Create prototype</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">SVG-first preview/export contract trước khi quyết định thêm canvas editor vào core.</p>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Tỷ lệ poster</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tỷ lệ poster">
            {(["4:5", "9:16"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={ratio === value} onClick={() => setRatio(value)} className={`min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${ratio === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-title">Tên sự kiện
          <input id="poster-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-tagline">Tagline
          <input id="poster-tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} maxLength={80} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium" htmlFor="poster-date">Ngày
            <input id="poster-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="poster-location">Địa điểm
            <input id="poster-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-accent">Màu nhấn
          <input id="poster-accent" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background p-1" />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10" htmlFor="poster-image">
          <ImagePlus aria-hidden="true" className="size-4" />
          Thay ảnh nền
          <input id="poster-image" type="file" accept="image/*" className="sr-only" onChange={(event) => handleImageChange(event.target.files?.[0])} />
        </label>

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">
          <p>Font: {fontReady ? "ready, có fallback" : "đang chờ tải"}</p>
          <p>QR: {qrDataUrl ? "ready" : "đang tạo"}</p>
          {message ? <p className="mt-1 font-medium text-foreground">{message}</p> : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={resetDraft}><RefreshCcw aria-hidden="true" />Reset</Button>
          <Button type="button" className="min-h-11 flex-1" onClick={() => void exportPng()} disabled={!qrDataUrl || !fontReady}><Download aria-hidden="true" />Export PNG</Button>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-border/80 bg-surface-sunken p-4 sm:p-6" aria-labelledby="poster-spike-preview">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="poster-spike-preview" className="font-heading text-lg font-semibold">Preview và export dùng cùng SVG</h2>
            <p className="text-sm text-muted-foreground">Safe zone thử nghiệm: 80 px · QR: 256 px source</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{ratio}</span>
        </div>
        <div className="mx-auto max-h-[75vh] w-full max-w-[42rem] overflow-auto rounded-2xl border border-border/80 bg-[#21182b] p-3 shadow-lg sm:p-5">
          <div className="mx-auto max-h-[68vh] w-full" style={{ aspectRatio: ratio === "4:5" ? "4 / 5" : "9 / 16" }}>
            <PosterSvg draft={draft} qrDataUrl={qrDataUrl} svgRef={svgRef} />
          </div>
        </div>
      </section>
    </div>
  )
}
