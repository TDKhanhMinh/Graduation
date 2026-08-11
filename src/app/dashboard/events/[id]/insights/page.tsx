import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { InsightsDashboard } from "@/components/insights/insights-dashboard"
import { getOwnedEventById } from "@/features/events/dal"
import {
  createDefaultInsightsRange,
  INSIGHTS_DEFAULT_RANGE_DAYS,
  insightsRangeSchema,
  isSupportedInsightsTimeZone,
} from "@/features/insights/contract"
import { getEventInsights } from "@/features/insights/dal"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const ALLOWED_DAYS = [7, 30, 90, 180, 366] as const

function parseInsightsQuery(
  searchParams: { days?: string; timezone?: string },
  eventTimezone: string,
) {
  const parsedDays = Number(searchParams.days)
  const days = ALLOWED_DAYS.includes(parsedDays as (typeof ALLOWED_DAYS)[number])
    ? parsedDays
    : INSIGHTS_DEFAULT_RANGE_DAYS
  const timezone =
    typeof searchParams.timezone === "string" && isSupportedInsightsTimeZone(searchParams.timezone)
      ? searchParams.timezone
      : isSupportedInsightsTimeZone(eventTimezone)
        ? eventTimezone
        : "UTC"
  const now = new Date()
  const range = createDefaultInsightsRange(now, timezone)
  range.from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const rangeCheck = insightsRangeSchema.safeParse(range)

  return {
    days,
    timezone,
    range: rangeCheck.success ? rangeCheck.data : createDefaultInsightsRange(now, "UTC"),
    wasAdjusted:
      (searchParams.days !== undefined && days !== parsedDays) ||
      (searchParams.timezone !== undefined && searchParams.timezone !== timezone),
  }
}

export default async function EventInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ days?: string; timezone?: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)
  if (!event) notFound()

  const query = parseInsightsQuery(await searchParams, event.timezone)
  const insights = await getEventInsights(event.id, query.range)
  if (!insights) notFound()

  return (
    <InsightsDashboard
      eventTitle={event.title}
      insights={insights}
      selectedDays={query.days}
      selectedTimezone={query.timezone}
      rangeWasAdjusted={query.wasAdjusted}
    />
  )
}
