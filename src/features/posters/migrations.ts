import { z } from "zod"

import {
  CURRENT_POSTER_DOCUMENT_VERSION,
  posterAssetSchema,
  posterDocumentSchema,
  posterElementSchema,
  posterEventCategorySchema,
  posterRatioSchema,
  type PosterDocument,
} from "./schema"

const legacyPosterDocumentV0Schema = z.object({
  version: z.literal(0),
  templateId: z.string().trim().min(1).max(120),
  ratio: posterRatioSchema,
  dimensions: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  elements: z.array(posterElementSchema).min(1),
  assets: z.array(posterAssetSchema).default([]),
  metadata: z.object({
    eventId: z.string().trim().min(1).max(120),
    eventCategory: posterEventCategorySchema.optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
    updatedAt: z.string().datetime({ offset: true }).optional(),
  }),
})

export function migratePosterDocument(input: unknown): PosterDocument {
  const versionResult = z.object({ version: z.number().int() }).safeParse(input)
  if (!versionResult.success) throw new Error("Tài liệu áp phích bắt buộc có phiên bản")

  if (versionResult.data.version === CURRENT_POSTER_DOCUMENT_VERSION) {
    return posterDocumentSchema.parse(input)
  }

  if (versionResult.data.version === 0) {
    const legacy = legacyPosterDocumentV0Schema.parse(input)
    const now = new Date().toISOString()

    return posterDocumentSchema.parse({
      ...legacy,
      version: CURRENT_POSTER_DOCUMENT_VERSION,
      templateVersion: 1,
      content: {
        title: "Legacy poster",
        tagline: "",
        date: "",
        location: "",
        publicUrl: "https://example.com/e/legacy",
      },
      metadata: {
        ...legacy.metadata,
        eventCategory: legacy.metadata.eventCategory ?? "general",
        createdAt: legacy.metadata.createdAt ?? now,
        updatedAt: now,
      },
    })
  }

  throw new Error(`Phiên bản tài liệu áp phích không được hỗ trợ: ${versionResult.data.version}`)
}
