import { z } from 'zod'

export const ACCOUNT_EXPORT_VERSION = 1 as const
export const ACCOUNT_DELETION_COOLING_OFF_DAYS = 30

export const accountDeletionStatusSchema = z.enum(['cooling_off', 'cancelled', 'purged'])
export type AccountDeletionStatus = z.infer<typeof accountDeletionStatusSchema>

export const accountDeletionRequestSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  status: accountDeletionStatusSchema,
  requested_at: z.string().datetime({ offset: true }),
  scheduled_for: z.string().datetime({ offset: true }),
  cancelled_at: z.string().datetime({ offset: true }).nullable(),
  purged_at: z.string().datetime({ offset: true }).nullable(),
})
export type AccountDeletionRequest = z.infer<typeof accountDeletionRequestSchema>

export const personalDataExportSchema = z.object({
  schema_version: z.literal(ACCOUNT_EXPORT_VERSION),
  generated_at: z.string().datetime({ offset: true }),
  profile: z.object({
    display_name: z.string().nullable(),
    avatar_url: z.string().url().nullable(),
  }),
  events: z.array(z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    event_date: z.string().datetime({ offset: true }).nullable(),
    starts_at: z.string().datetime({ offset: true }).nullable(),
    ends_at: z.string().datetime({ offset: true }).nullable(),
    timezone: z.string(),
    visibility: z.string(),
    created_at: z.string().datetime({ offset: true }),
  })),
  wishes: z.array(z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid(),
    sender_name: z.string(),
    content: z.string().nullable(),
    moderation_status: z.string(),
    created_at: z.string().datetime({ offset: true }),
  })),
})
export type PersonalDataExport = z.infer<typeof personalDataExportSchema>

export function createDeletionSchedule(requestedAt: Date): string {
  const scheduled = new Date(requestedAt)
  scheduled.setUTCDate(scheduled.getUTCDate() + ACCOUNT_DELETION_COOLING_OFF_DAYS)
  return scheduled.toISOString()
}

export function redactPersonalDataExport(input: PersonalDataExport): PersonalDataExport {
  return {
    ...input,
    events: input.events.map(({ id, slug, title, description, event_date, starts_at, ends_at, timezone, visibility, created_at }) => ({
      id,
      slug,
      title,
      description,
      event_date,
      starts_at,
      ends_at,
      timezone,
      visibility,
      created_at,
    })),
    wishes: input.wishes.map(({ id, event_id, sender_name, content, moderation_status, created_at }) => ({
      id,
      event_id,
      sender_name,
      content,
      moderation_status,
      created_at,
    })),
  }
}
