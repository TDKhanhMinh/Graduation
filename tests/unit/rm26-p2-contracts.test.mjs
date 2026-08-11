import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import {
  createOwnerExportFileName,
  ownerExportSnapshotSchema,
  serializeOwnerExportCsv,
  serializeOwnerExportJson,
} from "../../src/features/exports/contract.ts"
import {
  eventInsightsSchema,
  insightsRangeSchema,
} from "../../src/features/insights/contract.ts"

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8")

const snapshot = {
  schema_version: 1,
  consistency_at: "2026-08-11T03:00:00.000Z",
  event: {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "graduation-day",
    title: "Graduation Day",
    description: "A, safe event",
    event_date: "2026-08-11T10:00:00.000Z",
    starts_at: "2026-08-11T10:00:00.000Z",
    ends_at: "2026-08-11T11:00:00.000Z",
    timezone: "Asia/Ho_Chi_Minh",
    location_name: "Main Hall",
    location_address: null,
    host_name: "Host",
    host_title: "Chair",
    visibility: "unlisted",
    created_at: "2026-08-01T03:00:00.000Z",
  },
  wishes: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      sender_name: "Guest",
      content: "=2+2,hello\nnext",
      is_pinned: true,
      created_at: "2026-08-11T03:01:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      sender_name: "Second Guest",
      content: "Congratulations",
      is_pinned: false,
      created_at: "2026-08-11T03:02:00.000Z",
    },
  ],
}

test("P2 owner export is versioned, deterministic, bounded, and formula-safe", () => {
  const parsed = ownerExportSnapshotSchema.parse(snapshot)
  const json = serializeOwnerExportJson(parsed)
  const csv = serializeOwnerExportCsv(parsed)

  assert.equal(JSON.parse(json).schema_version, 1)
  assert.match(csv, /^schema_version,consistency_at,event_id/)
  assert.match(csv, /'=2\+2,hello/)
  assert.match(csv, /"'=2\+2,hello\r?\nnext"/)
  assert.equal(serializeOwnerExportCsv(parsed), csv)
  assert.equal(createOwnerExportFileName("Graduation Day / 2026", "csv"), "memoria-graduation-day-2026-export-v1.csv")
  assert.equal(json.includes("actor_key_hash"), false)
  assert.equal(json.includes("storage_path"), false)
  assert.equal(ownerExportSnapshotSchema.safeParse({ ...parsed, wishes: Array(901).fill(parsed.wishes[0]) }).success, false)
})

test("P2 insights contract enforces IANA timezone, 366-day range, DST-safe bucket shape, and privacy", () => {
  assert.equal(insightsRangeSchema.safeParse({
    from: "2026-03-08T00:00:00.000Z",
    to: "2026-03-09T00:00:00.000Z",
    timezone: "America/New_York",
    bucket: "day",
  }).success, true)
  assert.equal(insightsRangeSchema.safeParse({
    from: "2026-03-08T00:00:00.000Z",
    to: "2026-03-09T00:00:00.000Z",
    timezone: "Not/A-Timezone",
    bucket: "day",
  }).success, false)
  assert.equal(insightsRangeSchema.safeParse({
    from: "2026-01-01T00:00:00.000Z",
    to: "2027-01-03T00:00:00.000Z",
    timezone: "UTC",
    bucket: "day",
  }).success, false)

  const result = eventInsightsSchema.safeParse({
    schema_version: 1,
    event_id: "11111111-1111-4111-8111-111111111111",
    range: {
      from: "2026-03-08T00:00:00.000Z",
      to: "2026-03-09T00:00:00.000Z",
      timezone: "America/New_York",
      bucket: "day",
    },
    summary: { total: 0, pending: 0, approved: 0, rejected: 0, hidden: 0 },
    media: { total: 0, image: 0, audio: 0 },
    reactions: { total: 0, by_emoji: {} },
    trend: [],
  })
  assert.equal(result.success, true)
})

test("P2 server boundaries and SQL contracts remain explicit", async () => {
  const exportDal = await read("src/features/exports/dal.ts")
  const exportRoute = await read("src/app/api/exports/[eventId]/[format]/route.ts")
  const insightsDal = await read("src/features/insights/dal.ts")
  const exportMigration = await read("supabase/migrations/20260810130718_rm26_p2_t01_owner_export_snapshot.sql")
  const insightsMigration = await read("supabase/migrations/20260810133000_rm26_p2_t03_event_insights.sql")

  assert.match(exportDal, /import 'server-only'/)
  assert.match(exportDal, /get_owner_export_rows/)
  assert.match(exportRoute, /force-dynamic/)
  assert.match(exportRoute, /private, no-store/)
  assert.match(insightsDal, /import 'server-only'/)
  assert.match(insightsDal, /get_event_insights/)
  assert.match(exportMigration, /SECURITY INVOKER/)
  assert.match(exportMigration, /LIMIT LEAST\(GREATEST\(COALESCE\(p_limit, 901\), 1\), 901\)/)
  assert.match(insightsMigration, /SECURITY DEFINER/)
  assert.match(insightsMigration, /SET search_path = ''/)
  assert.match(insightsMigration, /pg_timezone_names/)
  assert.match(insightsMigration, /generate_series/)
})

test("P2 export center exposes owner routes and user-triggered print only", async () => {
  const nav = await read("src/components/dashboard/event-nav.tsx")
  const overview = await read("src/app/dashboard/events/[id]/page.tsx")
  const exportPage = await read("src/app/dashboard/events/[id]/export/page.tsx")
  const printPage = await read("src/app/dashboard/events/[id]/export/print/page.tsx")
  const controls = await read("src/components/exports/export-print-controls.tsx")
  const loading = await read("src/app/dashboard/events/[id]/export/loading.tsx")
  const error = await read("src/app/dashboard/events/[id]/export/error.tsx")

  assert.match(nav, /segment: '\/export'.*available: true/)
  assert.match(overview, /\/export/)
  assert.match(exportPage, /force-dynamic/)
  assert.match(exportPage, /getOwnedEventById/)
  assert.match(printPage, /force-dynamic/)
  assert.match(printPage, /getOwnerExportSnapshot/)
  assert.match(controls, /window\.print\(\)/)
  assert.match(controls, /type="button"/)
  assert.match(loading, /aria-busy="true"/)
  assert.match(error, /unstable_retry|reset\(\)/)
})


test("P2 insights UI keeps the typed aggregate server-first and accessible", async () => {
  const nav = await read("src/components/dashboard/event-nav.tsx")
  const overview = await read("src/app/dashboard/events/[id]/page.tsx")
  const page = await read("src/app/dashboard/events/[id]/insights/page.tsx")
  const dashboard = await read("src/components/insights/insights-dashboard.tsx")
  const controls = await read("src/components/insights/insights-range-controls.tsx")
  const loading = await read("src/app/dashboard/events/[id]/insights/loading.tsx")
  const error = await read("src/app/dashboard/events/[id]/insights/error.tsx")

  assert.match(nav, /segment: '\/insights'.*available: true/)
  assert.match(overview, /\/insights/)
  assert.match(page, /force-dynamic/)
  assert.match(page, /getEventInsights/)
  assert.match(page, /insightsRangeSchema/)
  assert.match(dashboard, /role="img"/)
  assert.match(dashboard, /<table/)
  assert.match(dashboard, /Chưa có dữ liệu/)
  assert.match(controls, /name="days"/)
  assert.match(controls, /name="timezone"/)
  assert.match(loading, /aria-busy="true"/)
  assert.match(error, /reset\(\)/)
})


test("P2 poster asset library keeps storage/provider boundaries and document references explicit", async () => {
  const storage = await read("src/features/posters/storage.ts")
  const provider = await read("src/features/posters/stock-provider.ts")
  const actions = await read("src/app/dashboard/events/[id]/poster-studio/asset-actions.ts")
  const editor = await read("src/features/posters/editor.ts")
  const library = await read("src/components/posters/PosterAssetLibrary.tsx")
  const page = await read("src/app/dashboard/events/[id]/poster-studio/page.tsx")

  assert.match(storage, /detectPosterAssetMime/)
  assert.match(storage, /validatePosterAssetUpload/)
  assert.match(provider, /server-only/)
  assert.match(provider, /PEXELS_API_KEY/)
  assert.match(provider, /localFallback/)
  assert.match(actions, /create_poster_asset_upload_session/)
  assert.match(actions, /POSTER_ASSET_BUCKET/)
  assert.match(actions, /getOwnedEventById/)
  assert.match(actions, /referencesAsset/)
  assert.match(editor, /insert-asset/)
  assert.match(editor, /assets: \[\.\.\.document\.assets, asset\]/)
  assert.match(library, /searchPosterStockAction/)
  assert.match(library, /togglePosterAssetFavorite/)
  assert.match(library, /onSelectAsset/)
  assert.match(page, /initialAssets/)
})
