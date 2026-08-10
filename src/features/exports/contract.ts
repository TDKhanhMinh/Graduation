import { z } from 'zod'

export const OWNER_EXPORT_SCHEMA_VERSION = 1 as const
export const OWNER_EXPORT_MAX_WISHES = 900

export const ownerExportEventSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  event_date: z.iso.datetime({ offset: true }).nullable(),
  starts_at: z.iso.datetime({ offset: true }).nullable(),
  ends_at: z.iso.datetime({ offset: true }).nullable(),
  timezone: z.string(),
  location_name: z.string().nullable(),
  location_address: z.string().nullable(),
  host_name: z.string().nullable(),
  host_title: z.string().nullable(),
  visibility: z.string(),
  created_at: z.iso.datetime({ offset: true }),
})

export const ownerExportWishSchema = z.object({
  id: z.uuid(),
  sender_name: z.string(),
  content: z.string().nullable(),
  is_pinned: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
})

export const ownerExportSnapshotSchema = z.object({
  schema_version: z.literal(OWNER_EXPORT_SCHEMA_VERSION),
  consistency_at: z.iso.datetime({ offset: true }),
  event: ownerExportEventSchema,
  wishes: z.array(ownerExportWishSchema).max(OWNER_EXPORT_MAX_WISHES),
})

export type OwnerExportEvent = z.infer<typeof ownerExportEventSchema>
export type OwnerExportWish = z.infer<typeof ownerExportWishSchema>
export type OwnerExportSnapshot = z.infer<typeof ownerExportSnapshotSchema>
export type OwnerExportFormat = 'csv' | 'json'

export const OWNER_EXPORT_CSV_HEADERS = [
  'schema_version',
  'consistency_at',
  'event_id',
  'event_slug',
  'event_title',
  'event_description',
  'event_date',
  'starts_at',
  'ends_at',
  'timezone',
  'location_name',
  'location_address',
  'host_name',
  'host_title',
  'visibility',
  'event_created_at',
  'wish_id',
  'sender_name',
  'content',
  'is_pinned',
  'wish_created_at',
] as const

function escapeCsvCell(value: string | number | boolean | null): string {
  const raw = value === null ? '' : String(value)
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

function toCsvRow(values: Array<string | number | boolean | null>): string {
  return values.map(escapeCsvCell).join(',')
}

export function serializeOwnerExportJson(snapshot: OwnerExportSnapshot): string {
  return JSON.stringify(ownerExportSnapshotSchema.parse(snapshot))
}

export function serializeOwnerExportCsv(snapshot: OwnerExportSnapshot): string {
  const parsed = ownerExportSnapshotSchema.parse(snapshot)
  const event = parsed.event
  const rows = parsed.wishes.length > 0 ? parsed.wishes : [null]

  return [
    toCsvRow([...OWNER_EXPORT_CSV_HEADERS]),
    ...rows.map((wish) => toCsvRow([
      parsed.schema_version,
      parsed.consistency_at,
      event.id,
      event.slug,
      event.title,
      event.description,
      event.event_date,
      event.starts_at,
      event.ends_at,
      event.timezone,
      event.location_name,
      event.location_address,
      event.host_name,
      event.host_title,
      event.visibility,
      event.created_at,
      wish?.id ?? null,
      wish?.sender_name ?? null,
      wish?.content ?? null,
      wish?.is_pinned ?? null,
      wish?.created_at ?? null,
    ])),
  ].join('\r\n') + '\r\n'
}

export function createOwnerExportFileName(slug: string, format: OwnerExportFormat): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'event'

  return `memoria-${safeSlug}-export-v${OWNER_EXPORT_SCHEMA_VERSION}.${format}`
}
