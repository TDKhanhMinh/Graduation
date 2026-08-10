import { z } from 'zod'

export const POSTER_DRAFT_HANDOFF_KEY = 'memoria:poster-draft-handoff:v1'
export const POSTER_DRAFT_HANDOFF_VERSION = 1 as const
export const POSTER_DRAFT_HANDOFF_TTL_MS = 30 * 60 * 1000
export const POSTER_DRAFT_HANDOFF_MAX_BYTES = 12_000

const posterDraftSchema = z.object({
  version: z.literal(POSTER_DRAFT_HANDOFF_VERSION),
  templateId: z.string().trim().min(1).max(80),
  category: z.enum(['wedding', 'birthday', 'graduation', 'corporate']),
  title: z.string().trim().min(1).max(60),
  paletteIndex: z.number().int().min(0).max(32),
  showQr: z.boolean(),
  ratio: z.enum(['4:5', '9:16']),
  createdAt: z.string().datetime({ offset: true }),
})

export type PosterDraftHandoff = z.infer<typeof posterDraftSchema>

export function serializePosterDraft(
  input: Omit<PosterDraftHandoff, 'version' | 'createdAt'>,
  now = new Date(),
): string | null {
  const parsed = posterDraftSchema.safeParse({
    ...input,
    version: POSTER_DRAFT_HANDOFF_VERSION,
    createdAt: now.toISOString(),
  })
  if (!parsed.success) return null

  const serialized = JSON.stringify(parsed.data)
  return new TextEncoder().encode(serialized).byteLength <= POSTER_DRAFT_HANDOFF_MAX_BYTES
    ? serialized
    : null
}

export function parsePosterDraft(
  value: string | null | undefined,
  now = new Date(),
): PosterDraftHandoff | null {
  if (!value) return null

  try {
    const parsed = posterDraftSchema.safeParse(JSON.parse(value))
    if (!parsed.success) return null
    if (now.getTime() - new Date(parsed.data.createdAt).getTime() > POSTER_DRAFT_HANDOFF_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}
