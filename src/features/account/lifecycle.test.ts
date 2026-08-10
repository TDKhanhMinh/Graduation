import { describe, expect, it } from 'vitest'

import {
  ACCOUNT_DELETION_COOLING_OFF_DAYS,
  createDeletionSchedule,
  personalDataExportSchema,
} from '@/features/account/lifecycle'

describe('account lifecycle contracts', () => {
  it('schedules a 30-day cooling-off window in UTC', () => {
    const requestedAt = new Date('2026-08-10T10:00:00.000Z')
    const scheduled = new Date(createDeletionSchedule(requestedAt))
    expect(ACCOUNT_DELETION_COOLING_OFF_DAYS).toBe(30)
    expect(scheduled.toISOString()).toBe('2026-09-09T10:00:00.000Z')
  })

  it('accepts only versioned, secret-free export shape', () => {
    const result = personalDataExportSchema.safeParse({
      schema_version: 1,
      generated_at: '2026-08-10T10:00:00.000Z',
      profile: { display_name: 'Owner', avatar_url: null },
      events: [],
      wishes: [],
    })
    expect(result.success).toBe(true)
    expect(personalDataExportSchema.safeParse({ schema_version: 2 }).success).toBe(false)
  })
})
