# RM26 Phase 3 release gate

Date: 2026-08-10

This document records the implementation gate for RM26 Phase 3 under the explicit fast-track authorization to bypass upstream task dependencies, Supabase Desktop/local runtime and test execution. It is not a production-release approval.

## Scope and status

| Task | Scope | Notion status | Evidence |
| --- | --- | --- | --- |
| RM26 P3-T01 | Durable export job contract, owner API, idempotency, worker contract and private artifact boundary | Done | `supabase/migrations/20260810075500_rm26_p3_t01_export_jobs.sql`, `src/features/exports/`, `workers/pdf/` |
| RM26 P3-T02 | Print-token protected snapshot route and isolated Puppeteer worker | Done | `src/app/api/exports/print/[jobId]/route.ts`, `workers/pdf/` |
| RM26 P3-T03 | Director session protocol, owner controls, display token and live invalidation | Done | `supabase/migrations/20260810082000_rm26_p3_t03_director_sessions.sql`, `src/features/director/`, `src/components/director/` |
| RM26 P3-T04 | Owner-first pending-wish notification, inbox, unread/read state and preferences | Done | `supabase/migrations/20260810065255_rm26_p3_t04_notifications.sql`, `src/features/notifications/`, `src/components/notifications/` |
| RM26 P3-T05 | Collaborator roles, hashed invitation lifecycle and management UI | Done | `supabase/migrations/20260810083500_rm26_p3_t05_collaborators.sql`, `src/features/collaboration/`, `src/app/api/collaborators/` |
| RM26 P3-T06 | Consolidated release gate | Done under waiver | This document and the execution note on the Notion task |

## Static verification

- `npm run typecheck` — PASS.
- `npm run lint` — PASS with 0 errors and 10 warnings in unrelated pre-existing files.
- `git diff --check -- . ':!package.json'` — PASS for the tracked diff; the pre-existing unrelated `package.json` trailing whitespace was intentionally excluded/preserved. Untracked files are not included by Git's diff check.
- Tests were not run by explicit user direction. The repository has no `test:unit` script in the current package manifest.
- Build was not rerun in this continuation; the previous attempt was blocked by the Google Geist/Geist Mono network font fetch.

## Security and boundary review

- Export jobs use immutable snapshots, idempotency keys, owner-scoped status/download access, one-time print-token consumption and a private storage bucket contract.
- Director sessions use hashed display tokens, owner-only command RPCs, monotonic protocol sequence checks and bounded live-session state.
- Notifications use an owner-scoped recipient boundary, dedupe key and minimal payload; no wish text, media URL or actor/IP data is emitted.
- Collaborator invitations store only a SHA-256 token hash, enforce event/email scope, expiry, one-time acceptance and owner-only management RPCs.
- No raw export, director or invitation token is logged by the new server/worker code.

## Known deviations

- P3-T03 public display uses a token-scoped server polling bridge. Owner controls use private Realtime invalidation. This avoids distributing a broad Realtime authorization token to anonymous display clients.
- P3-T05 adds the canonical role matrix and management boundary, while existing event DAL/actions/storage surfaces remain owner-only until the broader collaborator authorization migration is separately audited.
- Worker dependencies are declared in `workers/pdf/package.json` but were not installed or executed in this environment.

## Required before production release

1. Apply and rehearse all migrations on a disposable Supabase environment; run DB tests, advisors and RLS/function/storage negative cases.
2. Install and run the isolated PDF worker; verify lease expiry, retries, heartbeat, private artifact download and print-token replay.
3. Run browser critical paths for owner/non-owner, director display, notifications and invite acceptance for every role.
4. Re-run build with the required font/network provider available, then repeat typecheck, lint and diff-check on the release revision.
5. Review deployment secrets, rollback/restore procedure and the collaborator migration across all existing DAL/actions/storage surfaces.

## Delivery

- Branch: `main`
- Commit: none
- Pull request: none
- Release decision: implementation gate closed under explicit validation waiver; production release gate remains open.
