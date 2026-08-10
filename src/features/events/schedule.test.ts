import { describe, expect, it } from 'vitest'

import {
  eventScheduleSchema,
  formatDateTimeLocal,
  getEventLifecycle,
  isSupportedTimeZone,
  normalizeLocalDateTime,
} from '@/features/events/schedule'

describe('event schedule contract', () => {
  it('accepts IANA timezones and rejects unknown identifiers', () => {
    expect(isSupportedTimeZone('America/New_York')).toBe(true)
    expect(isSupportedTimeZone('Mars/Phobos')).toBe(false)

    expect(
      eventScheduleSchema.safeParse({
        timezone: 'America/New_York',
        starts_at: '2026-03-08T06:30:00.000Z',
        ends_at: '2026-03-08T08:30:00.000Z',
      }).success,
    ).toBe(true)
    expect(eventScheduleSchema.safeParse({ timezone: 'Mars/Phobos' }).success).toBe(false)
  })

  it('rejects an end instant that is not after the start instant', () => {
    const result = eventScheduleSchema.safeParse({
      timezone: 'UTC',
      starts_at: '2026-08-10T10:00:00.000Z',
      ends_at: '2026-08-10T09:59:59.000Z',
    })

    expect(result.success).toBe(false)
  })

  it('derives lifecycle from UTC instants and keeps event_date compatibility', () => {
    const beforeDstStart = new Date('2026-03-08T06:29:59.000Z')
    const duringEvent = new Date('2026-03-08T07:00:00.000Z')
    const afterEvent = new Date('2026-03-08T08:30:00.000Z')

    expect(
      getEventLifecycle(
        {
          starts_at: '2026-03-08T06:30:00.000Z',
          ends_at: '2026-03-08T08:30:00.000Z',
          timezone: 'America/New_York',
        },
        beforeDstStart,
      ),
    ).toBe('upcoming')
    expect(
      getEventLifecycle(
        {
          starts_at: '2026-03-08T06:30:00.000Z',
          ends_at: '2026-03-08T08:30:00.000Z',
          timezone: 'America/New_York',
        },
        duringEvent,
      ),
    ).toBe('live')
    expect(
      getEventLifecycle(
        {
          event_date: '2026-03-08T06:30:00.000Z',
        },
        afterEvent,
      ),
    ).toBe('live')
    expect(
      getEventLifecycle(
        {
          starts_at: '2026-03-08T06:30:00.000Z',
          ends_at: '2026-03-08T08:30:00.000Z',
        },
        afterEvent,
      ),
    ).toBe('ended')
  })

  it('round-trips a DST-aware local wall time through its IANA timezone', () => {
    const local = formatDateTimeLocal('2026-03-08T06:30:00.000Z', 'America/New_York')
    expect(local).toBe('2026-03-08T01:30')
    expect(normalizeLocalDateTime(local, 'America/New_York')).toBe('2026-03-08T06:30:00.000Z')
    expect(normalizeLocalDateTime('2026-03-08T02:30', 'America/New_York')).toBeNull()
  })
})
