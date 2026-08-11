import { z } from "zod"

import { localPosterTemplates } from "./templates"
import {
  CURRENT_POSTER_DOCUMENT_VERSION,
  posterEventCategorySchema,
  posterRatioSchema,
  posterDocumentSchema,
  posterAssetSchema,
  type PosterDocument,
} from "./schema"

export const quickCreateInputSchema = z.object({
  eventId: z.string().trim().min(1),
  eventCategory: posterEventCategorySchema,
  templateId: z.string().trim().min(1),
  ratio: posterRatioSchema,
  showQr: z.boolean().default(true),
  title: z.string().trim().min(1, "Tên sự kiện là bắt buộc").max(100),
  tagline: z.string().trim().max(80),
  date: z.string().trim().max(40),
  location: z.string().trim().max(120),
  publicUrl: z.string().trim().url(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundAsset: posterAssetSchema.optional(),
  logoAsset: posterAssetSchema.optional(),
  backgroundCrop: z.object({
    fit: z.enum(["cover", "contain"]),
    focalX: z.number().min(0).max(1),
    focalY: z.number().min(0).max(1),
    scale: z.number().positive().max(4),
  }).default({ fit: "cover", focalX: 0.5, focalY: 0.5, scale: 1 }),
})

export type QuickCreateInput = z.input<typeof quickCreateInputSchema>

export function createPosterDocumentFromQuickCreate(input: QuickCreateInput, now = new Date()): PosterDocument {
  const parsed = quickCreateInputSchema.parse(input)
  const template = localPosterTemplates.find((candidate) => candidate.id === parsed.templateId)
  if (!template) throw new Error(`Không tìm thấy mẫu áp phích cục bộ: ${parsed.templateId}`)
  if (!template.categories.includes(parsed.eventCategory)) {
    throw new Error(`Mẫu ${parsed.templateId} không hỗ trợ ${parsed.eventCategory}`)
  }

  const layout = template.layouts[parsed.ratio]
  if (!layout) throw new Error(`Mẫu ${parsed.templateId} không hỗ trợ ${parsed.ratio}`)

  const timestamp = now.toISOString()
  const elements = layout.elements.map((element) => {
    if (element.type === "qr") return { ...element, visible: parsed.showQr }
    if (element.type === "shape" && element.id === "background") {
      return { ...element, fill: parsed.accent }
    }
    if (element.type !== "text") return element

    if (element.bind === "event.title") return { ...element, text: parsed.title }
    if (element.bind === "event.tagline") return { ...element, text: parsed.tagline }
    if (element.bind === "event.date") return { ...element, text: parsed.date }
    if (element.bind === "event.location") return { ...element, text: parsed.location }
    return element
  })


  const backgroundElement = parsed.backgroundAsset ? [{
    id: "local-background",
    type: "image" as const,
    frame: { x: 0, y: 0, width: layout.width, height: layout.height },
    assetId: parsed.backgroundAsset.id,
    fit: parsed.backgroundCrop.fit,
    crop: parsed.backgroundCrop,
    locked: true,
    zIndex: 0,
  }] : []
  const logoElement = parsed.logoAsset ? [{
    id: "local-logo",
    type: "image" as const,
    frame: { x: 80, y: 250, width: 220, height: 120 },
    assetId: parsed.logoAsset.id,
    fit: "contain" as const,
    crop: { fit: "contain" as const, focalX: 0.5, focalY: 0.5, scale: 1 },
    locked: true,
    zIndex: 1,
  }] : []

  return posterDocumentSchema.parse({
    version: CURRENT_POSTER_DOCUMENT_VERSION,
    templateId: template.id,
    templateVersion: template.version,
    ratio: parsed.ratio,
    dimensions: { width: layout.width, height: layout.height },
    content: {
      title: parsed.title,
      tagline: parsed.tagline,
      date: parsed.date,
      location: parsed.location,
      publicUrl: parsed.publicUrl,
      backgroundAssetId: parsed.backgroundAsset?.id,
      logoAssetId: parsed.logoAsset?.id,
    },
    elements: [...backgroundElement, ...logoElement, ...elements],
    assets: [parsed.backgroundAsset, parsed.logoAsset].filter((asset): asset is NonNullable<typeof asset> => Boolean(asset)),
    metadata: {
      eventId: parsed.eventId,
      eventCategory: parsed.eventCategory,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  })
}
