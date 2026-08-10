BEGIN;

SELECT plan(9);

SELECT has_table('public', 'account_deletion_requests', 'Account deletion request table exists');

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_account_deletion_active'
  ),
  'Only one active cooling-off request is allowed per account'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_account_deletion_due'
  ),
  'Due deletion requests have a purge index'
);

SELECT is(
  has_table_privilege('anon', 'public.account_deletion_requests', 'SELECT'),
  false,
  'Anon cannot enumerate deletion requests'
);

SELECT is(
  has_table_privilege('authenticated', 'public.account_deletion_requests', 'SELECT'),
  false,
  'Authenticated users cannot bypass server lifecycle actions'
);

SELECT is(
  has_table_privilege('service_role', 'public.account_deletion_requests', 'SELECT'),
  true,
  'Service role owns lifecycle reads'
);

SELECT ok(
  (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.account_deletion_requests'::regclass
  ),
  'Deletion request RLS is enabled'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.account_deletion_requests'::regclass
      AND conname = 'account_deletion_schedule_check'
  ),
  'Deletion schedule constraint exists'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.account_deletion_requests'::regclass
      AND conname = 'account_deletion_status_timestamps_check'
  ),
  'Deletion status timestamp constraint exists'
);

SELECT * FROM finish();
ROLLBACK;
