import 'server-only'

import { verifySession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

import {
  eventInsightsSchema,
  insightsRangeSchema,
  type EventInsights,
  type InsightsRange,
} from './contract'

type InsightsRpcClient = {
  rpc(
    name: 'get_event_insights',
    args: {
      p_event_id: string
      p_range_start: string
      p_range_end: string
      p_timezone: string
      p_bucket: 'day'
    },
  ): Promise<{ data: unknown | null; error: { code?: string; message?: string } | null }>
}

export class InsightsValidationError extends Error {
  constructor() {
    super('INSIGHTS_RANGE_INVALID')
    this.name = 'InsightsValidationError'
  }
}

export class InsightsDataError extends Error {
  constructor() {
    super('INSIGHTS_DATA_UNAVAILABLE')
    this.name = 'InsightsDataError'
  }
}

export async function getEventInsights(
  eventId: string,
  range: InsightsRange,
): Promise<EventInsights | null> {
  const parsedRange = insightsRangeSchema.safeParse(range)
  if (!parsedRange.success) throw new InsightsValidationError()

  const session = await verifySession()
  if (!session) return null

  const supabase = await createClient()
  const { data, error } = await (supabase as unknown as InsightsRpcClient).rpc('get_event_insights', {
    p_event_id: eventId,
    p_range_start: parsedRange.data.from,
    p_range_end: parsedRange.data.to,
    p_timezone: parsedRange.data.timezone,
    p_bucket: parsedRange.data.bucket,
  })

  if (error) {
    if (error.code === '42501' || error.message?.includes('INSIGHTS_FORBIDDEN')) return null
    console.error('Event insights query failed', { code: error.code })
    throw new InsightsDataError()
  }

  const parsedInsights = eventInsightsSchema.safeParse(data)
  if (!parsedInsights.success) {
    console.error('Event insights response violated its typed contract')
    throw new InsightsDataError()
  }

  return parsedInsights.data
}
