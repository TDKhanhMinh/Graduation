BEGIN;

SELECT plan(6);

SET ROLE service_role;

CREATE TEMP TABLE rm26_first_page AS
SELECT id, is_pinned, created_at
FROM public.public_wishes_view
WHERE event_id = 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380e05'
ORDER BY is_pinned DESC, created_at DESC, id DESC
LIMIT 20;

CREATE TEMP TABLE rm26_second_page AS
WITH cursor_row AS (
  SELECT is_pinned, created_at, id
  FROM rm26_first_page
  ORDER BY is_pinned ASC, created_at ASC, id ASC
  LIMIT 1
)
SELECT wish.id, wish.is_pinned, wish.created_at
FROM public.public_wishes_view AS wish
CROSS JOIN cursor_row
WHERE wish.event_id = 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380e05'
  AND (
    wish.is_pinned < cursor_row.is_pinned
    OR (
      wish.is_pinned = cursor_row.is_pinned
      AND wish.created_at < cursor_row.created_at
    )
    OR (
      wish.is_pinned = cursor_row.is_pinned
      AND wish.created_at = cursor_row.created_at
      AND wish.id < cursor_row.id
    )
  )
ORDER BY wish.is_pinned DESC, wish.created_at DESC, wish.id DESC;

SELECT ok(
  (SELECT count(*) FROM public.public_wishes_view WHERE event_id = 'e5eebc99-9c0b-4ef8-bb6d-6bb9bd380e05') = 22,
  'Pagination fixture has more than one page'
);

SELECT ok(
  (SELECT count(*) FROM rm26_first_page) = 20,
  'Initial page uses the configured batch size'
);

SELECT ok(
  (SELECT count(*) FROM rm26_second_page) = 2,
  'Cursor returns the remaining same-timestamp rows'
);

SELECT is_empty(
  $$ SELECT id FROM rm26_first_page INTERSECT SELECT id FROM rm26_second_page $$,
  'Cursor pages do not overlap'
);

SELECT ok(
  (SELECT count(*) FROM (
    SELECT id FROM rm26_first_page
    UNION
    SELECT id FROM rm26_second_page
  ) AS all_pages) = 22,
  'Cursor pages cover every fixture row exactly once'
);

SELECT ok(
  (SELECT count(DISTINCT created_at) FROM rm26_first_page) = 1,
  'Tie-breaker coverage uses a shared timestamp'
);

SELECT * FROM finish();
ROLLBACK;
