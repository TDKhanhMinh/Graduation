import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  eventScheduleSchema,
  formatDateTimeLocal,
  getEventLifecycle,
  normalizeLocalDateTime,
} from "../../src/features/events/schedule.ts"
import {
  POSTER_DRAFT_HANDOFF_TTL_MS,
  parsePosterDraft,
  serializePosterDraft,
} from "../../src/features/posters/handoff.ts"
import {
  ACCOUNT_DELETION_COOLING_OFF_DAYS,
  createDeletionSchedule,
  personalDataExportSchema,
  redactPersonalDataExport,
} from "../../src/features/account/lifecycle.ts"

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8")

test("schedule contract round-trips an instant across DST and rejects a skipped wall time", () => {
  const instant = normalizeLocalDateTime("2026-03-08T03:30", "America/New_York")
  assert.equal(instant, "2026-03-08T07:30:00.000Z")
  assert.equal(formatDateTimeLocal(instant, "America/New_York"), "2026-03-08T03:30")
  assert.equal(normalizeLocalDateTime("2026-03-08T02:30", "America/New_York"), null)
})

test("schedule schema enforces IANA timezone, ranges, and field lengths", () => {
  assert.equal(eventScheduleSchema.safeParse({
    starts_at: "2026-08-11T10:00:00.000Z",
    ends_at: "2026-08-11T09:00:00.000Z",
    timezone: "Asia/Ho_Chi_Minh",
    location_name: null,
    location_address: null,
    host_name: null,
    host_title: null,
  }).success, false)
  assert.equal(eventScheduleSchema.safeParse({
    starts_at: null,
    ends_at: null,
    timezone: "Not/A-Timezone",
    location_name: null,
    location_address: null,
    host_name: null,
    host_title: null,
  }).success, false)
  assert.equal(eventScheduleSchema.safeParse({
    starts_at: null,
    ends_at: null,
    timezone: "UTC",
    location_name: "x".repeat(161),
    location_address: null,
    host_name: null,
    host_title: null,
  }).success, false)
})

test("event lifecycle has deterministic upcoming, live, and ended states", () => {
  const start = "2026-08-11T10:00:00.000Z"
  const end = "2026-08-11T11:00:00.000Z"
  assert.equal(getEventLifecycle({ starts_at: start, ends_at: end }, new Date("2026-08-11T09:59:59.000Z")), "upcoming")
  assert.equal(getEventLifecycle({ starts_at: start, ends_at: end }, new Date("2026-08-11T10:30:00.000Z")), "live")
  assert.equal(getEventLifecycle({ starts_at: start, ends_at: end }, new Date("2026-08-11T11:00:00.000Z")), "ended")
})

test("poster handoff is versioned, bounded, and expires", () => {
  const now = new Date("2026-08-11T03:00:00.000Z")
  const serialized = serializePosterDraft({
    templateId: "template-1",
    category: "graduation",
    title: "Ngày đáng nhớ",
    paletteIndex: 2,
    showQr: true,
    ratio: "4:5",
  }, now)
  assert.ok(serialized)
  assert.equal(parsePosterDraft(serialized, new Date(now.getTime() + 1_000))?.title, "Ngày đáng nhớ")
  assert.equal(parsePosterDraft(serialized, new Date(now.getTime() + POSTER_DRAFT_HANDOFF_TTL_MS + 1)), null)
  assert.equal(parsePosterDraft("{malformed", now), null)
})

test("account export redaction and deletion cooling-off are deterministic", () => {
  const requestedAt = new Date("2026-08-11T03:00:00.000Z")
  const expectedSchedule = new Date(requestedAt)
  expectedSchedule.setUTCDate(expectedSchedule.getUTCDate() + ACCOUNT_DELETION_COOLING_OFF_DAYS)
  assert.equal(createDeletionSchedule(requestedAt), expectedSchedule.toISOString())

  const candidate = personalDataExportSchema.parse({
    schema_version: 1,
    generated_at: requestedAt.toISOString(),
    profile: { display_name: "Owner", avatar_url: "https://example.com/avatar.png" },
    events: [{
      id: "11111111-1111-4111-8111-111111111111",
      slug: "event",
      title: "Event",
      description: null,
      event_date: null,
      starts_at: "2026-08-11T10:00:00.000Z",
      ends_at: null,
      timezone: "UTC",
      visibility: "unlisted",
      created_at: requestedAt.toISOString(),
    }],
    wishes: [{
      id: "22222222-2222-4222-8222-222222222222",
      event_id: "11111111-1111-4111-8111-111111111111",
      sender_name: "Guest",
      content: "Hello",
      moderation_status: "approved",
      created_at: requestedAt.toISOString(),
    }],
  })
  const redacted = redactPersonalDataExport(candidate)
  assert.deepEqual(Object.keys(redacted.profile), ["display_name", "avatar_url"])
  assert.deepEqual(Object.keys(redacted.events[0]), [
    "id", "slug", "title", "description", "event_date", "starts_at",
    "ends_at", "timezone", "visibility", "created_at",
  ])
})

test("P1 source keeps public pagination and privacy boundaries explicit", async () => {
  const dal = await read("src/features/wishes/dal.ts")
  const page = await read("src/app/(public)/e/[slug]/page.tsx")
  const welcome = await read("src/components/event-welcome/event-welcome.tsx")
  const auth = await read("src/app/auth/actions.ts")
  assert.match(dal, /encodePublicWishCursor/)
  assert.match(dal, /decodePublicWishCursor/)
  assert.match(page, /const fetchWishesAction = async/)
  assert.match(page, /'use server'/)
  assert.ok(page.includes("getApprovedWishesPage(publicEventId"))
  assert.match(welcome, /welcomeConfig\.showLocation/)
  assert.match(welcome, /welcomeConfig\.showHost/)
  assert.match(auth, /signOut\(\{ scope: ['"]local['"] \}\)/)
  assert.match(auth, /signOut\(\{ scope: ['"]global['"] \}\)/)
})

test("P1 database contracts keep schedule and deletion state service-controlled", async () => {
  const schedule = await read("supabase/migrations/20260810043251_rm26_p1_t02_event_schedule.sql")
  const deletion = await read("supabase/migrations/20260810051450_rm26_p1_t07_account_lifecycle.sql")
  assert.match(schedule, /ADD COLUMN starts_at timestamptz/)
  assert.match(schedule, /events_timezone_check/)
  assert.match(schedule, /events_schedule_range_check/)
  assert.match(schedule, /UPDATE public\.events\nSET starts_at = event_date/)
  assert.match(deletion, /CREATE TABLE public\.account_deletion_requests/)
  assert.match(deletion, /REVOKE ALL ON public\.account_deletion_requests FROM PUBLIC, anon, authenticated/)
  assert.match(deletion, /uq_account_deletion_active/)
})