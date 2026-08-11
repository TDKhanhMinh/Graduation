begin;

select plan(8);

select has_table('public', 'events', 'events table exists');
select has_column('public', 'events', 'starts_at', 'starts_at column exists');
select has_column('public', 'events', 'ends_at', 'ends_at column exists');
select has_column('public', 'events', 'timezone', 'timezone column exists');
select is_empty(
  $$select 1 from public.events
    where ends_at is not null
      and (starts_at is null or ends_at <= starts_at)$$,
  'all stored schedule ranges are valid'
);
select is_empty(
  $$select 1 from public.events
    where event_date is not null
      and starts_at is distinct from event_date$$,
  'legacy event_date backfill remains exact'
);
select ok(
  to_regclass('public.idx_events_schedule_visibility') is not null,
  'schedule visibility index exists'
);
select has_function(
  'private',
  'is_supported_timezone',
  array['text']::name[],
  'timezone validator exists'
);

select * from finish();
rollback;