begin;

select plan(11);

select has_schema('private', 'private schema exists for non-API rate-limit state');
select has_table('private', 'reaction_rate_limits', 'durable reaction limiter table exists');
select has_function(
  'public',
  'consume_reaction_rate_limit',
  array['text', 'integer', 'integer']::name[],
  'durable limiter RPC exists'
);
select has_function(
  'public',
  'toggle_wish_reaction',
  array['uuid', 'uuid', 'text', 'text']::name[],
  'reaction toggle RPC exists'
);

select function_lang_is(
  'public',
  'consume_reaction_rate_limit',
  array['text', 'integer', 'integer']::name[],
  'plpgsql',
  'limiter is plpgsql'
);
select function_lang_is(
  'public',
  'toggle_wish_reaction',
  array['uuid', 'uuid', 'text', 'text']::name[],
  'plpgsql',
  'toggle is plpgsql'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.consume_reaction_rate_limit(text,integer,integer)'::regprocedure),
  true,
  'limiter is server-controlled'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.toggle_wish_reaction(uuid,uuid,text,text)'::regprocedure),
  true,
  'toggle is server-controlled'
);

select is_empty(
  $$select 1 from information_schema.role_routine_grants
    where routine_schema = 'public'
      and routine_name in ('consume_reaction_rate_limit', 'toggle_wish_reaction')
      and grantee in ('anon', 'authenticated')$$,
  'anonymous and authenticated roles cannot execute reaction RPCs'
);
select is(
  (select relrowsecurity from pg_class where oid = 'private.reaction_rate_limits'::regclass),
  true,
  'rate-limit state has RLS enabled'
);
select ok(
  exists (
    select 1
    from pg_proc
    where oid = 'public.consume_reaction_rate_limit(text,integer,integer)'::regprocedure
      and array_to_string(proconfig, ',') like '%search_path=%'
  ),
  'limiter has an explicit search_path'
);

select * from finish();
rollback;