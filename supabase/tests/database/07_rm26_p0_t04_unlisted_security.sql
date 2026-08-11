begin;

select plan(8);

select has_view('public', 'public_wishes_view', 'public projection exists');
select is(
  (select coalesce((reloptions @> array['security_invoker=true']), false)
   from pg_class where oid = 'public.public_wishes_view'::regclass),
  true,
  'public projection is security invoker'
);
select is_empty(
  $$select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'public_wishes_view'
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'SELECT'$$,
  'browser roles cannot enumerate the public projection'
);
select is_empty(
  $$select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('events', 'wishes', 'wish_media')
      and grantee = 'anon'$$,
  'anonymous clients cannot read base public-wall tables'
);
select has_function('private', 'trg_wishes_realtime_event()', 'realtime trigger function exists');
select is(
  (select prosecdef from pg_proc where oid = 'private.trg_wishes_realtime_event()'::regprocedure),
  true,
  'realtime trigger uses a private definer boundary'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.wishes'::regclass
      and tgname = 'on_wish_status_change'
      and not tgisinternal
  ),
  'wish status trigger remains attached'
);
select ok(
  exists (
    select 1 from pg_proc
    where oid = 'private.trg_wishes_realtime_event()'::regprocedure
      and array_to_string(proconfig, ',') like '%search_path=%'
  ),
  'realtime trigger has an explicit search_path'
);

select * from finish();
rollback;