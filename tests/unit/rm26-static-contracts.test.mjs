import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8")

test("reaction server contract has no public-key secret fallback", async () => {
  const actor = await read("src/features/reactions/actor.ts")
  const env = await read("src/features/reactions/reaction-env.ts")
  assert.equal(actor.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), false)
  assert.match(env, /REACTION_SECRET_KEY/)
})

test("unlisted Data API migration revokes browser enumeration", async () => {
  const migration = await read("supabase/migrations/20260810034039_close_unlisted_data_api_enumeration.sql")
  assert.match(migration, /revoke all on public\.public_wishes_view from public, anon, authenticated/i)
  assert.match(migration, /revoke all on public\.events, public\.wishes, public\.wish_media from anon/i)
  assert.match(migration, /trg_wishes_realtime_event/)
})

test("guided-tour mascot offsets are defined by the dashboard config", async () => {
  const config = await read("src/components/guided-tour/config-dashboard.ts")
  assert.match(config, /mascotOffset: 100/)
  assert.match(config, /mascotOffset: 60/)
})