"use client"

import { Download, ImagePlus, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createQrDataUrl } from "@/features/sharing/qr"
import { localPosterTemplates } from "@/features/posters/templates"
import { createPosterDocumentFromQuickCreate } from "@/features/posters/quick-create"
import { POSTER_CROP_PRESETS, getPosterSvgImageAlignment, preparePosterImage, type PreparedPosterImage, type PosterCropPreset } from "@/features/posters/asset-pipeline"
import { type PosterEventCategory, type PosterRatio } from "@/features/posters/schema"
import { formatPosterDate, getPosterDimensions, wrapPosterText } from "@/features/posters/spike"
import { getPosterQrFrame, posterExportFilename, validatePosterExportQuality } from "@/features/posters/quality"

type PosterQuickCreateProps = {
  eventId: string
  eventTitle: string
  eventDate: string | null
  publicUrl: string
  initialCategory: PosterEventCategory
}

const ratios = ["4:5", "9:16"] as const
const categories: Array<{ value: PosterEventCategory; label: string }> = [
  { value: "graduation", label: "Graduation" },
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "general", label: "General" },
]

function PosterPreview({
  document,
  imageDataUrl,
  logoDataUrl,
  qrDataUrl,
  svgRef,
  palette,
  cropPreset,
  onImageError,
  onLogoError,
}: {
  document: ReturnType<typeof createPosterDocumentFromQuickCreate>
  imageDataUrl: string
  logoDataUrl: string
  qrDataUrl: string
  svgRef: React.RefObject<SVGSVGElement | null>
  palette: readonly string[]
  cropPreset: PosterCropPreset
  onImageError: () => void
  onLogoError: () => void
}) {
  const { width, height } = getPosterDimensions(document.ratio as "4:5" | "9:16")
  const titleLines = wrapPosterText(document.content.title, document.ratio === "4:5" ? 22 : 20).slice(0, 4)
  const titleStartY = document.ratio === "4:5" ? 650 : 880
  const qrSize = document.ratio === "4:5" ? 190 : 210
  const qrX = width - qrSize - 80
  const qrY = height - qrSize - 80
  const background = palette[0] ?? "#241b2f"
  const secondary = palette[1] ?? "#5d2d4a"
  const accent = palette[2] ?? "#c85b45"
  const foreground = palette[3] ?? "#fff9ef"

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Poster preview: ${document.content.title}`}
      className="block h-full w-full"
    >
      <defs>
        <linearGradient id="quick-create-background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={background} />
          <stop offset="58%" stopColor={secondary} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <radialGradient id="quick-create-glow" cx="78%" cy="18%" r="58%">
          <stop offset="0%" stopColor={foreground} stopOpacity="0.9" />
          <stop offset="100%" stopColor={foreground} stopOpacity="0" />
        </radialGradient>
        <clipPath id="quick-create-image-clip">
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>

      <rect width={width} height={height} fill="url(#quick-create-background)" />
      {imageDataUrl ? (
        <image href={imageDataUrl} x="0" y="0" width={width} height={height} preserveAspectRatio={getPosterSvgImageAlignment(POSTER_CROP_PRESETS[cropPreset])} opacity="0.5" onError={onImageError} clipPath="url(#quick-create-image-clip)" />
      ) : null}
      <rect width={width} height={height} fill={background} opacity="0.28" />
      <rect width={width} height={height} fill="url(#quick-create-glow)" />
      {logoDataUrl ? <image href={logoDataUrl} x="80" y="250" width="220" height="120" preserveAspectRatio="xMidYMid meet" onError={onLogoError} /> : null}
      <circle cx={width * 0.1} cy={height * 0.16} r={width * 0.18} fill={accent} opacity="0.18" />
      <circle cx={width * 0.92} cy={height * 0.72} r={width * 0.2} fill={foreground} opacity="0.12" />

      <g fontFamily="Geist, Arial, sans-serif" fill={foreground}>
        <text x="80" y="120" fontSize="28" letterSpacing="8" fill={foreground}>MEMORIA</text>
        <text x="80" y="190" fontSize="22" letterSpacing="4" opacity="0.78">A MOMENT TO REMEMBER</text>
        <text x="80" y={titleStartY} fontSize={document.ratio === "4:5" ? 82 : 74} fontWeight="700">
          {titleLines.map((line, index) => (
            <tspan key={`${line}-${index}`} x="80" dy={index === 0 ? 0 : 96}>{line}</tspan>
          ))}
        </text>
        <text x="80" y={titleStartY + titleLines.length * 96 + 30} fontSize="30" fill={foreground} opacity="0.88">
          {document.content.tagline || "A moment worth remembering"}
        </text>
        <line x1="80" y1={titleStartY + titleLines.length * 96 + 92} x2={width - 80} y2={titleStartY + titleLines.length * 96 + 92} stroke={foreground} strokeOpacity="0.5" />
        <text x="80" y={titleStartY + titleLines.length * 96 + 152} fontSize="34" fontWeight="600">
          {formatPosterDate(document.content.date)}
        </text>
        <text x="80" y={titleStartY + titleLines.length * 96 + 208} fontSize="30" opacity="0.86">
          {document.content.location || "Event location"}
        </text>
      </g>

      {qrDataUrl ? (
        <g transform={`translate(${qrX} ${qrY})`}>
          <rect width={qrSize} height={qrSize} rx="18" fill="#fffdf9" />
          <image href={qrDataUrl} x="18" y="18" width={qrSize - 36} height={qrSize - 36} />
        </g>
      ) : null}
      <text x="80" y={height - 92} fontFamily="Geist, Arial, sans-serif" fontSize="22" letterSpacing="3" fill={foreground} opacity="0.7">
        SCAN TO JOIN THE MEMORY WALL
      </text>
    </svg>
  )
}

export function PosterQuickCreate({ eventId, eventTitle, eventDate, publicUrl, initialCategory }: PosterQuickCreateProps) {
  const [ratio, setRatio] = useState<PosterRatio>("4:5")
  const [category, setCategory] = useState<PosterEventCategory>(initialCategory)
  const [templateId, setTemplateId] = useState(localPosterTemplates[0]?.id ?? "")
  const [title, setTitle] = useState(eventTitle)
  const [tagline, setTagline] = useState("A moment worth remembering")
  const [date, setDate] = useState(eventDate?.slice(0, 10) ?? "")
  const [location, setLocation] = useState("Memoria Hall")
  const [accent, setAccent] = useState("#c85b45")
  const [imageDataUrl, setImageDataUrl] = useState("")
  const [preparedAsset, setPreparedAsset] = useState<PreparedPosterImage | null>(null)
  const [preparedLogo, setPreparedLogo] = useState<PreparedPosterImage | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState("")
  const [cropPreset, setCropPreset] = useState<PosterCropPreset>("center")
  const [imageFailed, setImageFailed] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [fontReady, setFontReady] = useState(false)
  const [imageError, setImageError] = useState("")
  const svgRef = useRef<SVGSVGElement>(null)

  const template = useMemo(
    () => localPosterTemplates.find((candidate) => candidate.id === templateId) ?? localPosterTemplates[0],
    [templateId],
  )
  const posterDocument = useMemo(() => {
    if (!template) return null
    try {
      return createPosterDocumentFromQuickCreate({
        eventId,
        eventCategory: category,
        templateId: template.id,
        ratio,
        title,
        tagline,
        date,
        location,
        publicUrl,
        accent,
        backgroundAsset: preparedAsset?.asset,
        logoAsset: preparedLogo?.asset,
        backgroundCrop: POSTER_CROP_PRESETS[cropPreset],
      })
    } catch {
      return null
    }
  }, [accent, category, cropPreset, date, eventId, location, preparedAsset, preparedLogo, publicUrl, ratio, tagline, template, title])

  const titleError = title.trim().length === 0 ? "Event title is required" : ""
  const qualityGate = useMemo(() => {
    if (!posterDocument || !template) return { success: false as const, errors: ["Poster document is not ready"] }
    return validatePosterExportQuality({
      ratio: posterDocument.ratio as "4:5" | "9:16",
      publicUrl: posterDocument.content.publicUrl,
      fontReady,
      assetsReady: Boolean(qrDataUrl) && !imageFailed && !logoFailed,
      safeArea: template.layouts[posterDocument.ratio].safeArea,
      qr: getPosterQrFrame(posterDocument.ratio as "4:5" | "9:16"),
    })
  }, [fontReady, imageFailed, logoFailed, posterDocument, qrDataUrl, template])

  useEffect(() => {
    let cancelled = false
    void createQrDataUrl(publicUrl, 256).then((value) => {
      if (!cancelled) setQrDataUrl(value)
    }).catch(() => {
      if (!cancelled) toast.error("QR generation is temporarily unavailable.")
    })
    return () => { cancelled = true }
  }, [publicUrl])

  useEffect(() => {
    void globalThis.document.fonts.ready.then(() => setFontReady(true))
  }, [])

  async function handleImageChange(file: File | undefined) {
    if (!file) return
    setImageError("")
    try {
      const prepared = await preparePosterImage(file)
      setPreparedAsset(prepared)
      setImageDataUrl(prepared.dataUrl)
      setImageFailed(false)
    setLogoFailed(false)
      setCropPreset("center")
      toast.success(`Image prepared locally at ${prepared.width} x ${prepared.height}.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "The selected image could not be prepared."
      setImageError(errorMessage)
      toast.error(errorMessage)
    }
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return
    try {
      const prepared = await preparePosterImage(file, { kind: "logo" })
      setPreparedLogo(prepared)
      setLogoDataUrl(prepared.dataUrl)
      setLogoFailed(false)
      toast.success(`Logo prepared locally at ${prepared.width} x ${prepared.height}.`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "The selected logo could not be prepared."
      setImageError(errorMessage)
      toast.error(errorMessage)
    }
  }
  function resetDraft() {
    setCategory(initialCategory)
    setTemplateId(localPosterTemplates[0]?.id ?? "")
    setRatio("4:5")
    setTitle(eventTitle)
    setTagline("A moment worth remembering")
    setDate(eventDate?.slice(0, 10) ?? "")
    setLocation("Memoria Hall")
    setAccent("#c85b45")
    setImageDataUrl("")
    setPreparedAsset(null)
    setPreparedLogo(null)
    setLogoDataUrl("")
    setCropPreset("center")
    setImageFailed(false)
    setLogoFailed(false)
    setImageError("")
    toast.success("Draft reset to the event defaults.")
  }

  async function exportPng() {
    if (!svgRef.current || !posterDocument || titleError) return
    if (!qualityGate.success) {
      toast.error(qualityGate.errors.join(" "))
      return
    }
    if (globalThis.document.fonts?.ready) await globalThis.document.fonts.ready
    const { width, height } = getPosterDimensions(posterDocument.ratio as "4:5" | "9:16")
    const svg = svgRef.current.cloneNode(true) as SVGSVGElement
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink")
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
    const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }))

    try {
      const image = new Image()
      image.decoding = "async"
      image.src = svgUrl
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error("SVG export image failed to load"))
      })
      const scale = qualityGate.scale
      const canvas = globalThis.document.createElement("canvas")
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
      anchor.download = posterExportFilename(posterDocument.content.title, posterDocument.ratio as "4:5" | "9:16")
      anchor.click()
      URL.revokeObjectURL(downloadUrl)
      toast.success(`PNG exported at ${canvas.width} x ${canvas.height}.`)
    } catch {
      toast.error("PNG export failed. Try again when the preview is ready.")
    } finally {
      URL.revokeObjectURL(svgUrl)
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
      <section className="min-w-0 space-y-5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="poster-quick-create-controls">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Quick Create</p>
          <h2 id="poster-quick-create-controls" className="mt-1 font-heading text-xl font-semibold">Create a poster in minutes</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Local templates, local fonts, and a live preview. No stock or font API is required.</p>
        </div>

        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-category">Event type
          <select id="poster-category" value={category} onChange={(event) => setCategory(event.target.value as PosterEventCategory)} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
            {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Template</span>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Local poster templates">
            {localPosterTemplates.map((item) => (
              <button key={item.id} type="button" aria-pressed={template?.id === item.id} onClick={() => setTemplateId(item.id)} className={`min-h-16 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${template?.id === item.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                <span className="block font-semibold">{item.name}</span>
                <span className="mt-1 flex gap-1" aria-hidden="true">{item.palette.slice(0, 4).map((color) => <span key={color} className="size-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Poster ratio</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Poster ratio">
            {ratios.map((value) => <button key={value} type="button" aria-pressed={ratio === value} onClick={() => setRatio(value)} className={`min-h-10 rounded-xl border px-4 text-sm font-medium ${ratio === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{value}</button>)}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-title">Event title
          <input id="poster-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? "poster-title-error" : undefined} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          {titleError ? <span id="poster-title-error" role="alert" className="text-xs font-normal text-destructive">{titleError}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-tagline">Tagline (optional)
          <input id="poster-tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} maxLength={80} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium" htmlFor="poster-date">Date (optional)
            <input id="poster-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="poster-location">Location (optional)
            <input id="poster-location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="poster-accent">Accent color
          <input id="poster-accent" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background p-1" />
        </label>
        {preparedAsset ? <label className="grid gap-2 text-sm font-medium" htmlFor="poster-crop">Crop preset
          <select id="poster-crop" value={cropPreset} onChange={(event) => setCropPreset(event.target.value as PosterCropPreset)} className="min-h-11 rounded-xl border border-input bg-background px-3 font-normal outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <span className="text-xs font-normal text-muted-foreground">{preparedAsset.width} x {preparedAsset.height}, compressed locally</span>
        </label> : null}

        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10" htmlFor="poster-image">
          <ImagePlus aria-hidden="true" className="size-4" />
          Add optional background image
          <input id="poster-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void handleImageChange(event.target.files?.[0])} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10" htmlFor="poster-logo">
          <ImagePlus aria-hidden="true" className="size-4" />
          Add optional logo
          <input id="poster-logo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void handleLogoChange(event.target.files?.[0])} />
        </label>
        {imageError ? <p role="alert" className="text-xs text-destructive">{imageError}</p> : null}

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">
          <p>Font: {fontReady ? "ready with fallback" : "loading"}</p>
          <p>QR: {qrDataUrl ? "ready" : "generating"}</p>
          <p>Export gate: {qualityGate.success ? "ready" : "waiting"}</p>
          {!qualityGate.success ? <p className="mt-1 text-destructive">{qualityGate.errors.join(" ")}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={resetDraft}><RefreshCcw aria-hidden="true" />Reset</Button>
          <Button type="button" className="min-h-11 flex-1" onClick={() => void exportPng()} disabled={!qualityGate.success || Boolean(titleError)}><Download aria-hidden="true" />Export PNG</Button>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-border/80 bg-surface-sunken p-4 sm:p-6" aria-labelledby="poster-quick-create-preview">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="poster-quick-create-preview" className="font-heading text-lg font-semibold">Live preview</h2>
            <p className="text-sm text-muted-foreground">Preview and export share the same SVG renderer.</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{ratio}</span>
        </div>
        <div className="mx-auto max-h-[75vh] w-full max-w-[42rem] overflow-auto rounded-2xl border border-border/80 bg-[#21182b] p-3 shadow-lg sm:p-5">
          <div className="mx-auto max-h-[68vh] w-full" style={{ aspectRatio: ratio === "4:5" ? "4 / 5" : "9 / 16" }}>
            {posterDocument && template ? <PosterPreview document={posterDocument} imageDataUrl={imageFailed ? "" : imageDataUrl} logoDataUrl={logoFailed ? "" : logoDataUrl} qrDataUrl={qrDataUrl} svgRef={svgRef} palette={template.palette} cropPreset={cropPreset} onImageError={() => { setImageFailed(true); toast.error("Image failed to render; using the template background fallback.") }} onLogoError={() => { setLogoFailed(true); toast.error("Logo failed to render; using the poster without a logo.") }} /> : <div className="flex h-full items-center justify-center rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">Enter an event title to preview the poster.</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
