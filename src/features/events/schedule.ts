import { z } from 'zod'

export const eventLifecycleSchema = z.enum(['upcoming', 'live', 'ended', 'unscheduled'])
export type EventLifecycle = z.infer<typeof eventLifecycleSchema>

export type EventScheduleRecord = {
  event_date?: string | null
  starts_at?: string | null
  ends_at?: string | null
  timezone?: string | null
  location_name?: string | null
  location_address?: string | null
  host_name?: string | null
  host_title?: string | null
}

export function isSupportedTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

const optionalDateTime = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional()

export const eventScheduleSchema = z
  .object({
    starts_at: optionalDateTime,
    ends_at: optionalDateTime,
    timezone: z
      .string()
      .trim()
      .min(1)
      .refine(isSupportedTimeZone, 'Timezone phải là IANA identifier được hỗ trợ.'),
    location_name: z.string().trim().max(160).nullable().optional(),
    location_address: z.string().trim().max(500).nullable().optional(),
    host_name: z.string().trim().max(160).nullable().optional(),
    host_title: z.string().trim().max(160).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.ends_at && !value.starts_at) {
      context.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'ends_at chỉ được đặt khi starts_at đã có.',
      })
    }

    if (value.starts_at && value.ends_at && Date.parse(value.ends_at) <= Date.parse(value.starts_at)) {
      context.addIssue({
        code: 'custom',
        path: ['ends_at'],
        message: 'ends_at phải lớn hơn starts_at.',
      })
    }
  })

export type EventScheduleInput = z.infer<typeof eventScheduleSchema>

function dateTimeParts(value: Date, timezone: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(value)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
}

export function formatDateTimeLocal(
  value: string | null | undefined,
  timezone: string,
): string {
  if (!validInstant(value) || !isSupportedTimeZone(timezone)) return ''

  const parts = dateTimeParts(new Date(value), timezone)
  return [
    parts.year,
    '-',
    parts.month,
    '-',
    parts.day,
    'T',
    parts.hour,
    ':',
    parts.minute,
  ].join('')
}

export function normalizeLocalDateTime(
  value: string | null | undefined,
  timezone: string,
): string | null {
  if (!value?.trim()) return null
  if (!isSupportedTimeZone(timezone)) return null
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return validInstant(value) ? new Date(value).toISOString() : null
  }

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null

  const requestedWall = [
    match[1],
    'T',
    match[2],
    ':',
    match[3] ?? '00',
  ].join('')
  const requestedMs = Date.parse(requestedWall + 'Z')
  if (!Number.isFinite(requestedMs)) return null

  let candidate = new Date(requestedMs)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateTimeParts(candidate, timezone)
    const renderedWall = [
      parts.year,
      '-',
      parts.month,
      '-',
      parts.day,
      'T',
      parts.hour,
      ':',
      parts.minute,
      ':',
      parts.second,
    ].join('')
    const renderedMs = Date.parse(renderedWall + 'Z')
    candidate = new Date(candidate.getTime() + requestedMs - renderedMs)
  }

  const finalParts = dateTimeParts(candidate, timezone)
  const finalWall = [
    finalParts.year,
    '-',
    finalParts.month,
    '-',
    finalParts.day,
    'T',
    finalParts.hour,
    ':',
    finalParts.minute,
  ].join('')
  if (finalWall !== match[1] + 'T' + match[2]) return null

  return candidate.toISOString()
}

function validInstant(value: string | null | undefined): value is string {
  return Boolean(value && Number.isFinite(Date.parse(value)))
}

export function getEventLifecycle(
  event: EventScheduleRecord,
  now: Date = new Date(),
): EventLifecycle {
  const start = validInstant(event.starts_at) ? event.starts_at : event.event_date
  if (!validInstant(start)) return 'unscheduled'

  const startMs = Date.parse(start)
  if (now.getTime() < startMs) return 'upcoming'

  if (validInstant(event.ends_at)) {
    return now.getTime() >= Date.parse(event.ends_at) ? 'ended' : 'live'
  }

  return 'live'
}
