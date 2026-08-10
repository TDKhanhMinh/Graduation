# RM26 P2-T03 Dashboard Insights Contract

## Boundary

`public.get_event_insights(uuid, timestamptz, timestamptz, text, text)` is the only aggregate read boundary. It is owner-only, checks `auth.uid()` against the non-deleted event owner, and returns JSON aggregates without wish text, sender identity, actor IDs/hashes, IP data, moderation reasons, or storage paths.

The function is `SECURITY DEFINER` only because `wish_reactions` and `wish_media` are intentionally service-only tables. It uses `SET search_path = ''`, an explicit owner predicate, a bounded range, and revokes execution from `PUBLIC`, `anon`, and `service_role`; only `authenticated` receives execute permission.

## Semantics

- Range is half-open: `[from, to)`.
- Maximum range is 366 days.
- Bucket is currently `day` only.
- Bucket boundaries are midnight in the requested IANA timezone, then represented as UTC instants in `bucket_start`; local calendar labels are returned separately as `local_date`.
- `summary.total` counts all non-deleted wishes in the range. Status counters cover `pending`, `approved`, `rejected`, and `hidden`.
- `media` counts ready image/audio rows linked to non-deleted pending or approved wishes in the range. Storage paths and URLs are excluded.
- `reactions` counts reactions in the range only for non-deleted approved wishes and groups by emoji without actor identity.
- `trend` is zero-filled for every local day in the selected range and contains the same wish status counts plus approved-wish reaction counts.

## Performance and cache policy

The response is produced by one database call; the dashboard must not fetch raw rows or issue one query per card. The migration adds event/time, wish/reaction, and wish/media indexes for the representative filters. Query plans should be checked on a representative dataset with `EXPLAIN (ANALYZE, BUFFERS)` before release.

Owner-specific results are request-time data and are not shared through Next.js caching. P2-T04 may refresh after a mutation or explicit range change; no cross-owner cache key is permitted.
