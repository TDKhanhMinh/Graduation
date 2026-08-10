# Export jobs operations

RM26 P3-T01 adds an owner-scoped `export_jobs` queue and the private
`yearbook-exports` bucket. The API stores only an immutable snapshot and
SHA-256 token/snapshot hashes. Plain print tokens must not be logged or stored.

## Required server configuration

Set `EXPORT_PRINT_TOKEN_SECRET` to a random value of at least 32 characters on
the Next.js server and the PDF worker. The value is never sent to the browser.

## API boundary

- `POST /api/exports/jobs` creates or reuses a job using `Idempotency-Key`.
- `GET /api/exports/jobs/:jobId` returns owner-scoped state only.
- `DELETE /api/exports/jobs/:jobId` cancels queued or processing work for the owner.
- `GET /api/exports/jobs/:jobId/download` returns a 10-minute signed URL only for
  a completed artifact and the owning session.

## Worker boundary

The worker uses only the service-role RPC grants for `claim_export_job`,
`prepare_export_print_token`, `complete_export_job`, and `fail_export_job`.
Claims have a short lease; rendering and upload must happen after the claim
transaction has released its row lock. An expired lease is reclaimed until the
bounded attempt count is exhausted, then the job becomes `failed`.

## Retention and recovery

Artifacts must be stored under `<owner_id>/<job_id>/...pdf` in the private
bucket. Cleanup should remove expired artifacts before deleting terminal job
metadata. A worker restart is safe because claim, completion, and failure
commands are lease- and worker-scoped.
