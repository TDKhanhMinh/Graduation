import { z } from 'zod'

export const INSIGHTS_SCHEMA_VERSION = 1 as const
export const INSIGHTS_BUCKET = 'day' as const
export const INSIGHTS_MAX_RANGE_DAYS = 366
export const INSIGHTS_DEFAULT_RANGE_DAYS = 30

const nonNegativeIntegerSchema = z.number().int().nonnegative()

export const insightsRangeSchema = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
  timezone: z.string().min(1),
  bucket: z.literal(INSIGHTS_BUCKET),
}).superRefine((range, context) => {
  const from = Date.parse(range.from)
  const to = Date.parse(range.to)

  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    context.addIssue({ code: 'custom', message: 'Insights range must be increasing' })
    return
  }

  if (to - from > INSIGHTS_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    context.addIssue({ code: 'custom', message: 'Insights range is too large' })
  }
})

export const eventInsightsSummarySchema = z.object({
  total: nonNegativeIntegerSchema,
  pending: nonNegativeIntegerSchema,
  approved: nonNegativeIntegerSchema,
  rejected: nonNegativeIntegerSchema,
  hidden: nonNegativeIntegerSchema,
})

export const eventInsightsMediaSchema = z.object({
  total: nonNegativeIntegerSchema,
  image: nonNegativeIntegerSchema,
  audio: nonNegativeIntegerSchema,
})

export const eventInsightsReactionsSchema = z.object({
  total: nonNegativeIntegerSchema,
  by_emoji: z.record(z.string(), nonNegativeIntegerSchema),
})

export const eventInsightsTrendBucketSchema = z.object({
  bucket_start: z.iso.datetime({ offset: true }),
  local_date: z.iso.date(),
  total: nonNegativeIntegerSchema,
  pending: nonNegativeIntegerSchema,
  approved: nonNegativeIntegerSchema,
  rejected: nonNegativeIntegerSchema,
  hidden: nonNegativeIntegerSchema,
  reactions: nonNegativeIntegerSchema,
})

export const eventInsightsSchema = z.object({
  schema_version: z.literal(INSIGHTS_SCHEMA_VERSION),
  event_id: z.uuid(),
  range: insightsRangeSchema,
  summary: eventInsightsSummarySchema,
  media: eventInsightsMediaSchema,
  reactions: eventInsightsReactionsSchema,
  trend: z.array(eventInsightsTrendBucketSchema),
})

export type InsightsRange = z.infer<typeof insightsRangeSchema>
export type EventInsights = z.infer<typeof eventInsightsSchema>

export function createDefaultInsightsRange(
  now = new Date(),
  timezone = 'UTC',
): InsightsRange {
  return {
    from: new Date(now.getTime() - INSIGHTS_DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
    timezone,
    bucket: INSIGHTS_BUCKET,
  }
}
