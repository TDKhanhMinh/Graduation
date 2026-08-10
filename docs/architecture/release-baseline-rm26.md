# RM26 release baseline and recovery decision record

**Recorded:** 2026-08-10  
**Repository baseline:** `251aad8` on `main`  
**Purpose:** establish the current, verifiable implementation baseline before any RM26 remediation. A historical Notion `Done` status or execution note is not evidence that its deliverable is present or safe at this HEAD.

## Evidence used

- Current ADR: `docs/architecture/graduation-message-mvp-decisions.md`.
- Current blueprint: `docs/graduation-message-technical-blueprint-v2.md`.
- Current source and migrations at `251aad8`.
- Historical task contracts in the Notion Tasks database, queried on 2026-08-10.
- Git history: `7562371` introduced print/export/PDF-worker artifacts; `fb71b0b` subsequently removed them.

## Recovery decision

Do not cherry-pick `7562371`. It combines unrelated cleanup/configuration with a removed export implementation, uses an older application boundary, and does not constitute evidence of the current security contracts. The deleted export/PDF files are **historical reference only**: a later feature phase may rebuild them against the current ADR, authorization, snapshot, and private-delivery contracts.

The RM26 P0 work is deliberately remediation, not a duplicate implementation of the historical backlog: it repairs current-head security and data-loss regressions before any historical feature is restored.

## Traceability matrix

| Historical deliverable | Historical status | Current-head evidence and risk | Decision | RM26 owner / dependency | Release gate |
|---|---|---|---|---|---|
| GM-V2 P1-T01 data/security contract | Done | ADR remains approved, but current reaction, Data API and rate-limit code violate its server-only, non-enumeration and durable-limiter requirements. High. | Keep ADR as source of truth; remediate enforcement. | P0-T02, P0-T03, P0-T04; all depend on this baseline. | Contract and negative security tests must pass. |
| GM-V2 P1-T02 core schema, grants and RLS | Done | Core migrations exist. `20260804015418_phase2_public_wishes_view_grants.sql` grants global view SELECT to `anon, authenticated`; reaction RPC lacks fixed search path and explicit grants. Critical. | Remediate forward-only; never edit applied migrations. | P0-T03 after P0-T02; P0-T04 after P0-T01. | pgTAP grants/RLS and Supabase advisors when runtime is available. |
| GM-V2 P1-T03 test harness/types | Done | Unit harness/types exist, but no demonstrated coverage for the current reaction, unlisted-enumeration and partial event-write regressions. High. | Remediate test coverage. | P0-T02 to P0-T05; consolidated by P0-T06. | Unit and DB/route regression tests. |
| GM-V2 P1-T04 server-only config/observability | Done | `server-only` modules and observability utilities exist, but reaction secrets are read directly with a public-key fallback and no current release evidence. High. | Remediate configuration boundary and release evidence. | P0-T02, P0-T06. | Missing-secret, redaction and release-gate checks. |
| GM-V2 P1-T07 public text wall | Done | Exact-slug server DAL exists in `src/features/events/dal.ts`, but Data API grants permit global public/unlisted projection enumeration. Critical. | Remediate, retain server-first lookup. | P0-T04 after P0-T01. | REST, HTML/payload, pgTAP and E2E checks. |
| GM-V2 P4-T03 reaction model/secure toggle | Done | Reaction files exist, but `actor.ts` falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `dal.ts` has mojibake emoji values; SQL function is `SECURITY DEFINER` without fixed `search_path`, eligibility or locked grants. Critical. | Remediate; do not accept historical completion as baseline. | P0-T02 then P0-T03. | Actor/cookie/unit tests, pgTAP, concurrency and advisor checks. |
| GM-V2 P4-T05 metrics and abuse tuning | Done | `src/lib/rate-limit.ts` is an in-process `Map`, which cannot limit across serverless instances and keys raw IP in memory. High. | Rebuild the rate-limit primitive on the approved durable contract. | P0-T03, then P0-T06 evidence. | Durable multi-instance and retention tests. |
| GM-V2 P5-T01 protected print route | Done | `src/app/(public)/e/[slug]/print/page.tsx` is absent; it was added in `7562371` and deleted in `fb71b0b`. High product drift, no P0 restoration authorization. | Intentionally dropped from P0 baseline; historical reference for a later rebuild. | Future RM26 export phase, after P0 security gates. | Owner/approved-only print acceptance. |
| GM-V2 P5-T02 export jobs/snapshot/API | Done | Export API, DAL and `20260803102700_export_jobs.sql` are absent after `fb71b0b`. Critical if advertised; not restored in P0. | Historical reference only; rebuild, do not cherry-pick. | Future RM26 export phase, after P0. | Immutable approved snapshot and private-output tests. |
| GM-V2 P5-T03 PDF worker/private delivery | Done | `workers/pdf/**`, worker migration and private-delivery implementation are absent after `fb71b0b`. Critical if advertised; not restored in P0. | Historical reference only; rebuild against current worker boundary. | Future RM26 export phase, after P0. | Lease/retry, private delivery and worker observability tests. |
| GM-V2 P5-T04 export dashboard | Done | Dashboard export page/components are absent after `fb71b0b`. Medium product drift; dependent backend is absent. | Intentionally dropped from P0; rebuild only after export jobs/worker. | Future RM26 export phase after P5-T02/T03 rebuild. | Owner-only, polling and retry tests. |
| GM-V2 P5-T05 security/privacy/restore | Done | Current public grants, reaction command and rate limit contradict its historical security outcome; export restore surface is absent. Critical. | Remediate P0 security blockers; use historical task as reference, not evidence. | P0-T02 to P0-T04; P0-T06 aggregates release evidence. | Security regressions, advisors and runtime evidence. |
| GM-V2 P5-T06 performance/accessibility/release gate | Done | Current head has no complete runtime proof for DB/E2E; release baseline must distinguish static PASS from unavailable runtime gates. High. | Rebuild release gate evidence. | P0-T06 after P0-T03, P0-T04 and P0-T05. | Unit/lint/typecheck/build/diff plus explicitly evidenced DB/E2E. |

## RM26 P0 execution order

1. **P0-T01** establishes this baseline and traceability record.
2. **P0-T02** seals guest-actor and canonical emoji contracts.
3. **P0-T03** hardens the database command and durable limiter on top of P0-T02.
4. **P0-T04** closes unlisted enumeration independently after P0-T01.
5. **P0-T05** prevents partial event writes from erasing `event_date` independently after P0-T01.
6. **P0-T06** is the release gate and may start only after P0-T03, P0-T04 and P0-T05 are done.

## Evidence policy for RM26 completion

Each RM26 task may be marked Done only after its Notion execution note identifies changed files, validation commands and results, and every required acceptance criterion has direct evidence. Static commands cannot stand in for runtime evidence. In particular, database/advisor/REST/Playwright checks are **BLOCKED**, not PASS, whenever the local Docker/Supabase runtime is unavailable.
