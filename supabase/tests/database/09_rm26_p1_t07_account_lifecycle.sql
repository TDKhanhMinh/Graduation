begin;

select plan(7);

select has_table('public', 'account_deletion_requests', 'account deletion request table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.account_deletion_requests'::regclass),
  true,
  'account deletion state has RLS enabled'
);
select is_empty(
  $$select 1 from information_schema.table_privileges
    where table_schema = 'public'
      and table_name = 'account_deletion_requests'
      and grantee in ('PUBLIC', 'anon', 'authenticated')$$,
  'browser roles cannot mutate lifecycle state'
);
select ok(
  exists (
    select 1 from pg_class
    where oid = 'public.uq_account_deletion_active'::regclass
      and relkind = 'i'
  ),
  'active deletion request uniqueness index exists'
);
select is_empty(
  $$select 1 from public.account_deletion_requests
    where status not in ('cooling_off', 'cancelled', 'purged')
       or (status = 'cancelled' and cancelled_at is null)
       or (status <> 'cancelled' and cancelled_at is not null)$$,
  'deletion state timestamps match status'
);
select is_empty(
  $$select 1 from public.account_deletion_requests
    where scheduled_for < requested_at$$,
  'scheduled deletion cannot precede request time'
);
select ok(
  exists (
    select 1 from pg_class
    where oid = 'public.idx_account_deletion_due'::regclass
      and relkind = 'i'
  ),
  'due deletion index exists'
);

select * from finish();
rollback;