# RM26 Phase 1 Release Gate

Ngày đối soát: 2026-08-11
Repository: D:/Graduation
Branch: main

## Current queue

RM26 P1-T01 through P1-T07 remain In progress. Their historical static implementations were re-verified against current HEAD; this pass added executable P1 contract tests and deployed the additive schedule/deletion-state migrations. Tasks are not marked Done while required DB/browser/E2E or implementation gates remain incomplete.

## Static and unit evidence

- npm run test:unit: PASS, 15/15.
- npm run typecheck: PASS.
- Targeted ESLint for P1 files: PASS.
- Full ESLint remains blocked by existing user landing work in product-story-scrollytelling.tsx.
- Full build remains blocked by unavailable Google Fonts fetch.
- Scoped RM26 diff-check passes; full worktree diff-check still reports existing trailing whitespace in src/components/landing/event-journey.tsx.

## Remote database evidence

Applied forward-only migrations:

- P1-T02 event schedule contract.
- P1-T07 account deletion request state.

Read-only checks pass:

- events has starts_at, ends_at, timezone, location and host fields.
- schedule constraints and visibility index exist.
- event_count is 8, backfill mismatch is 0, invalid timezone/range counts are 0.
- account_deletion_requests exists with RLS; browser roles have no table grants.
- Security advisors show expected policy-less service-only lifecycle tables plus unrelated existing warnings.

## Remaining blockers

- Local Supabase reset cannot complete because baseline migration 20260805020602 calls missing public.rls_auto_enable().
- Linked remote has no pgTAP plan() function, so pgTAP cannot run there.
- No Playwright/E2E suite exists in the current checkout.
- Direct REST/browser checks are blocked by the environment proxy.
- P1-T07 still lacks the reviewed worker/RPC transaction for owner mutation lock, soft-delete snapshot, restore window, retention purge and auth identity transition. No destructive workflow was invented or executed.
- P1-T01/T03/T04/T05/T06 still need browser and/or DB/RLS evidence for their runtime acceptance.

## Delivery

No commit or pull request created. Existing unrelated landing changes are preserved.