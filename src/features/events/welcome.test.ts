import { describe, expect, it } from 'vitest'

import {
  createWelcomeViewModel,
  formatWelcomeDate,
  resolveWelcomeStatus,
} from '@/features/events/welcome'

describe('public Welcome schedule contract', () => {
  const schedule = {
    starts_at: '2026-03-08T06:30:00.000Z',
    ends_at: '2026-03-08T08:30:00.000Z',
    timezone: 'America/New_York',
  }

  it('uses event timezone for date/time output', () => {
    expect(formatWelcomeDate(schedule.starts_at, schedule.timezone)).toContain('1:30')
  })

  it('derives upcoming/live/ended with submission mode precedence', () => {
    expect(resolveWelcomeStatus(schedule, new Date('2026-03-08T06:29:59.000Z'))).toBe('upcoming')
    expect(resolveWelcomeStatus(schedule, new Date('2026-03-08T07:00:00.000Z'))).toBe('live')
    expect(resolveWelcomeStatus(schedule, new Date('2026-03-08T08:30:00.000Z'))).toBe('ended')
    expect(resolveWelcomeStatus({ ...schedule, submission_mode: 'closed' }, new Date('2026-03-08T07:00:00.000Z'))).toBe('closed')
  })

  it('counts down to starts_at and preserves event_date fallback', () => {
    expect(createWelcomeViewModel(schedule, new Date('2026-03-08T06:00:00.000Z')).countdownTarget).toBe(schedule.starts_at)
    expect(
      createWelcomeViewModel({ event_date: '2026-08-10T10:00:00.000Z' }, new Date('2026-08-10T09:00:00.000Z')).countdownTarget,
    ).toBe('2026-08-10T10:00:00.000Z')
  })
})
