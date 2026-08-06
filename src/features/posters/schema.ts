import { z } from "zod"

export const CURRENT_POSTER_DOCUMENT_VERSION = 1 as const

export const posterRatioSchema = z.enum(["4:5", "9:16", "1:1", "16:9"])
export type PosterRatio = z.infer<typeof posterRatioSchema>

export const posterEventCategorySchema = z.enum(["graduation", "wedding", "birthday", "corporate", "general"])
export type PosterEventCategory = z.infer<typeof posterEventCategorySchema>

export const posterBindingSchema = z.enum([
  "event.title",
  "event.tagline",
  "event.date",
  "event.location",
  "event.publicUrl",
  "event.cover",
  "event.logo",
])
export type PosterBinding = z.infer<typeof posterBindingSchema>

const identifierSchema = z.string().trim().min(1).max(120)
const nonNegativeNumberSchema = z.number().finite().min(0)
const positiveNumberSchema = z.number().finite().positive()
const colorSchema = z.string().regex(/^(#[0-9a-fA-F]{3,8}|transparent|currentColor)$/)

export const posterFrameSchema = z.object({
  x: nonNegativeNumberSchema,
  y: nonNegativeNumberSchema,
  width: positiveNumberSchema,
  height: positiveNumberSchema,
})
export type PosterFrame = z.infer<typeof posterFrameSchema>

export const posterSafeAreaSchema = z.object({
  top: nonNegativeNumberSchema,
  right: nonNegativeNumberSchema,
  bottom: nonNegativeNumberSchema,
  left: nonNegativeNumberSchema,
})

const posterElementBaseSchema = z.object({
  id: identifierSchema,
  frame: posterFrameSchema,
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
  zIndex: z.number().int().min(0).default(0),
  rotation: z.number().finite().default(0),
})

export const posterTextConstraintsSchema = z.object({
  maxLines: z.number().int().positive().max(12),
  minFontSize: positiveNumberSchema,
  maxFontSize: positiveNumberSchema,
  autoFit: z.boolean().default(true),
  overflow: z.enum(["clip", "ellipsis"]).default("clip"),
}).superRefine((value, context) => {
  if (value.minFontSize > value.maxFontSize) {
    context.addIssue({ code: "custom", path: ["minFontSize"], message: "minFontSize must not exceed maxFontSize" })
  }
})

export const posterTextElementSchema = posterElementBaseSchema.extend({
  type: z.literal("text"),
  bind: posterBindingSchema.optional(),
  text: z.string().max(500).default(""),
  editable: z.boolean().default(true),
  style: z.object({
    fontFamily: identifierSchema,
    fontSize: positiveNumberSchema,
    fontWeight: z.number().int().min(100).max(900).default(400),
    fill: colorSchema,
    align: z.enum(["left", "center", "right"]).default("left"),
    lineHeight: positiveNumberSchema.default(1.2),
    letterSpacing: z.number().finite().default(0),
  }),
  constraints: posterTextConstraintsSchema,
})

export const posterImageElementSchema = posterElementBaseSchema.extend({
  type: z.literal("image"),
  bind: z.enum(["event.cover", "event.logo"]).optional(),
  assetId: identifierSchema.optional(),
  fit: z.enum(["cover", "contain"]).default("cover"),
  crop: z.object({
    focalX: z.number().min(0).max(1).default(0.5),
    focalY: z.number().min(0).max(1).default(0.5),
    scale: positiveNumberSchema.default(1),
  }),
}).superRefine((value, context) => {
  if (!value.bind && !value.assetId) {
    context.addIssue({ code: "custom", path: ["assetId"], message: "An image must bind to an event asset or provide an assetId" })
  }
})

export const posterShapeElementSchema = posterElementBaseSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "line"]),
  fill: colorSchema,
  opacity: z.number().min(0).max(1).default(1),
})

export const posterSvgElementSchema = posterElementBaseSchema.extend({
  type: z.literal("svg"),
  assetId: identifierSchema,
  fill: colorSchema.optional(),
})

export const posterQrElementSchema = posterElementBaseSchema.extend({
  type: z.literal("qr"),
  bind: z.literal("event.publicUrl"),
  minSize: positiveNumberSchema,
  quietZone: z.number().int().min(2).max(16).default(4),
  foreground: colorSchema.default("#111827"),
  background: colorSchema.default("#ffffff"),
})

export const posterGroupElementSchema = posterElementBaseSchema.extend({
  type: z.literal("group"),
  childIds: z.array(identifierSchema).min(1),
})

export const posterElementSchema = z.discriminatedUnion("type", [
  posterTextElementSchema,
  posterImageElementSchema,
  posterShapeElementSchema,
  posterSvgElementSchema,
  posterQrElementSchema,
  posterGroupElementSchema,
])
export type PosterElement = z.infer<typeof posterElementSchema>

export const externalAssetReferenceSchema = z.object({
  provider: z.enum(["local", "pexels", "unsplash"]),
  providerAssetId: identifierSchema,
  sourceUrl: z.string().url().optional(),
  photographerName: z.string().trim().max(160).optional(),
  photographerUrl: z.string().url().optional(),
  attributionRequired: z.boolean().default(false),
})
export type ExternalAssetReference = z.infer<typeof externalAssetReferenceSchema>

export const posterAssetSchema = z.object({
  id: identifierSchema,
  kind: z.enum(["background", "logo", "decoration", "photo"]),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  path: identifierSchema,
  external: externalAssetReferenceSchema.optional(),
})
export type PosterAsset = z.infer<typeof posterAssetSchema>

export const posterTemplateLayoutSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  safeArea: posterSafeAreaSchema,
  elements: z.array(posterElementSchema).min(1),
}).superRefine((value, context) => {
  const ids = value.elements.map((element) => element.id)
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", path: ["elements"], message: "Template element ids must be unique" })
  }
})
export type PosterTemplateLayout = z.infer<typeof posterTemplateLayoutSchema>

export const posterTemplateSchema = z.object({
  id: identifierSchema,
  name: z.string().trim().min(1).max(120),
  version: z.number().int().positive(),
  categories: z.array(posterEventCategorySchema).min(1),
  supportedRatios: z.array(posterRatioSchema).min(2),
  thumbnail: z.string().min(1),
  fonts: z.array(identifierSchema).min(1),
  palette: z.array(colorSchema).min(2),
  requiredElementIds: z.array(identifierSchema).min(1),
  layouts: z.record(z.string(), posterTemplateLayoutSchema),
}).superRefine((value, context) => {
  for (const ratio of Object.keys(value.layouts)) {
    if (!posterRatioSchema.safeParse(ratio).success) {
      context.addIssue({ code: "custom", path: ["layouts", ratio], message: `Unsupported layout ratio ${ratio}` })
    }
  }
  if (new Set(value.supportedRatios).size !== value.supportedRatios.length) {
    context.addIssue({ code: "custom", path: ["supportedRatios"], message: "supportedRatios must be unique" })
  }

  for (const ratio of value.supportedRatios) {
    if (!value.layouts[ratio]) {
      context.addIssue({ code: "custom", path: ["layouts", ratio], message: `Missing layout for ${ratio}` })
    }
  }

  for (const ratio of ["4:5", "9:16"] as const) {
    if (!value.supportedRatios.includes(ratio)) {
      context.addIssue({ code: "custom", path: ["supportedRatios"], message: `MVP template must support ${ratio}` })
    }
  }

  const allElementIds = new Set(Object.values(value.layouts).flatMap((layout) => layout.elements.map((element) => element.id)))
  for (const id of value.requiredElementIds) {
    if (!allElementIds.has(id)) {
      context.addIssue({ code: "custom", path: ["requiredElementIds"], message: `Required element ${id} is not present in any layout` })
    }
  }
})
export type PosterTemplate = z.infer<typeof posterTemplateSchema>

export const posterContentSchema = z.object({
  title: z.string().trim().min(1).max(100),
  tagline: z.string().trim().max(80).default(""),
  date: z.string().trim().max(40).default(""),
  location: z.string().trim().max(120).default(""),
  publicUrl: z.string().trim().min(1).max(2048),
  logoAssetId: identifierSchema.optional(),
  backgroundAssetId: identifierSchema.optional(),
})
export type PosterContent = z.infer<typeof posterContentSchema>

export type PosterDimensions = { width: number; height: number }

const posterDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const posterDocumentSchema = z.object({
  version: z.literal(CURRENT_POSTER_DOCUMENT_VERSION),
  templateId: identifierSchema,
  templateVersion: z.number().int().positive(),
  ratio: posterRatioSchema,
  dimensions: posterDimensionsSchema,
  content: posterContentSchema,
  elements: z.array(posterElementSchema).min(1),
  assets: z.array(posterAssetSchema).default([]),
  metadata: z.object({
    eventId: identifierSchema,
    eventCategory: posterEventCategorySchema.default("general"),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  }),
}).superRefine((value, context) => {
  const expectedDimensions: Record<PosterRatio, PosterDimensions> = {
    "4:5": { width: 1080, height: 1350 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
    "16:9": { width: 1920, height: 1080 },
  }
  const expected = expectedDimensions[value.ratio]
  if (value.dimensions.width !== expected.width || value.dimensions.height !== expected.height) {
    context.addIssue({ code: "custom", path: ["dimensions"], message: `Dimensions do not match ${value.ratio}` })
  }
})
export type PosterDocument = z.infer<typeof posterDocumentSchema>

export function validatePosterDocumentAgainstTemplate(documentInput: unknown, templateInput: unknown) {
  const documentResult = posterDocumentSchema.safeParse(documentInput)
  const templateResult = posterTemplateSchema.safeParse(templateInput)
  const issues = [
    ...(documentResult.success ? [] : documentResult.error.issues.map((issue) => `document.${issue.path.join(".")}: ${issue.message}`)),
    ...(templateResult.success ? [] : templateResult.error.issues.map((issue) => `template.${issue.path.join(".")}: ${issue.message}`)),
  ]

  if (!documentResult.success || !templateResult.success) return { success: false as const, issues }

  const document = documentResult.data
  const template = templateResult.data
  const layout = template.layouts[document.ratio]
  if (!template.supportedRatios.includes(document.ratio)) issues.push(`template does not support ${document.ratio}`)
  if (!layout) issues.push(`template has no layout for ${document.ratio}`)

  const elementIds = new Set(document.elements.map((element) => element.id))
  for (const requiredId of template.requiredElementIds) {
    if (!elementIds.has(requiredId)) issues.push(`document is missing required element ${requiredId}`)
  }

  return { success: issues.length === 0, issues, document, template } as const
}

export function resolvePosterEventCategory(event: { theme_key?: string | null; experience_preset?: string | null }): PosterEventCategory {
  if (event.theme_key === "graduation" || event.experience_preset === "graduation") return "graduation"
  if (event.experience_preset === "romantic") return "wedding"
  if (event.experience_preset === "celebration") return "birthday"
  return "general"
}
