import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const read = (path) => readFile(new URL("../../" + path, import.meta.url), "utf8")

test("P3 export retention uses Storage API before metadata finalization", async () => {
  const migration = await read("supabase/migrations/20260811090000_rm26_p3_t01_export_retention.sql")
  const worker = await read("workers/pdf/src/worker.ts")
  const config = await read("workers/pdf/src/config.ts")
  const docs = await read("docs/operations/export-jobs.md")
  const packageJson = JSON.parse(await read("workers/pdf/package.json"))

  assert.match(migration, /get_export_artifacts_to_cleanup/)
  assert.match(migration, /finalize_export_artifact_cleanup/)
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.get_export_artifacts_to_cleanup[\s\S]*TO service_role/)
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.finalize_export_artifact_cleanup[\s\S]*TO service_role/)
  assert.match(worker, /storage[\s\S]*\.from\('yearbook-exports'\)[\s\S]*\.remove\(\[candidate\.artifact_path\]\)/)
  assert.match(worker, /finalize_export_artifact_cleanup/)
  assert.match(config, /retentionHours/)
  assert.match(config, /cleanupBatchSize/)
  assert.match(docs, /Storage API/)
  assert.equal(packageJson.dependencies["@supabase/supabase-js"], "2.111.0")
  assert.equal(packageJson.dependencies.puppeteer, "24.15.0")
})


test("P3 collaboration authorization consumes the canonical role matrix", async () => {
  const access = await read("src/features/collaboration/access.ts")
  const collaboratorsRoute = await read("src/app/api/collaborators/route.ts")
  const collaboratorDetailRoute = await read("src/app/api/collaborators/[collaboratorId]/route.ts")

  assert.match(access, /requireEventCapability/)
  assert.match(access, /can\(access\.role, capability\)/)
  assert.match(collaboratorsRoute, /requireEventCapability\(eventId, 'manage_collaborators'\)/)
  assert.match(collaboratorDetailRoute, /requireEventCapability\(parsed\.data\.eventId, 'manage_collaborators'\)/)
})
