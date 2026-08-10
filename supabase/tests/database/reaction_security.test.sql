begin;

select plan(21);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.toggle_wish_reaction(uuid,uuid,text,text)'::regprocedure
  ),
  'Reaction toggle is explicitly security definer'
);

select ok(
  (
    select proconfig @> array['search_path=""']
    from pg_proc
    where oid = 'public.toggle_wish_reaction(uuid,uuid,text,text)'::regprocedure
  ),
  'Reaction toggle uses an empty search path'
);

select ok(
  (
    select proconfig @> array['search_path=""']
    from pg_proc
    where oid = 'public.consume_reaction_rate_limit(text,integer,integer)'::regprocedure
  ),
  'Reaction rate limiter uses an empty search path'
);

select is(
  has_function_privilege('anon', 'public.toggle_wish_reaction(uuid,uuid,text,text)', 'execute'),
  false,
  'Anon cannot execute the reaction command'
);

select is(
  has_function_privilege('authenticated', 'public.toggle_wish_reaction(uuid,uuid,text,text)', 'execute'),
  false,
  'Authenticated clients cannot execute the reaction command directly'
);

select is(
  has_function_privilege('anon', 'public.consume_reaction_rate_limit(text,integer,integer)', 'execute'),
  false,
  'Anon cannot execute the durable limiter'
);

select is(
  has_table_privilege('anon', 'private.reaction_rate_limits', 'select'),
  false,
  'Anon cannot read opaque limiter counters'
);

set role service_role;

select is(
  public.toggle_wish_reaction(
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    null,
    '👍'
  ),
  true,
  'Service boundary can add one reaction to an approved public wish'
);

select is(
  public.toggle_wish_reaction(
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    null,
    '👍'
  ),
  false,
  'A second serialized toggle removes the same reaction'
);

select is_empty(
  $$ select 1 from public.wish_reactions
     where wish_id = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'
       and actor_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
       and emoji = '👍' $$,
  'Serialized toggles leave no duplicate reaction'
);

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Pending wishes cannot receive reactions'
);

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Rejected wishes cannot receive reactions'
);

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a4eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Hidden wishes cannot receive reactions'
);

insert into public.wishes (
  id, event_id, client_request_id, sender_name, content, moderation_status
)
values (
  'a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
  'e3eebc99-9c0b-4ef8-bb6d-6bb9bd380e03',
  'c5eebc99-9c0b-4ef8-bb6d-6bb9bd380c05',
  'Private event wish', 'Not reactable', 'approved'
);

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Private events cannot receive reactions'
);

update public.events
set archived_at = pg_catalog.now()
where id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01';

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Archived events cannot receive reactions'
);

update public.events
set archived_at = null
where id = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01';

update public.wishes
set deleted_at = pg_catalog.now()
where id = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, '👍'
     ) $$,
  'P0001',
  'REACTION_TARGET_UNAVAILABLE',
  'Deleted wishes cannot receive reactions'
);

update public.wishes
set deleted_at = null
where id = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';

select throws_ok(
  $$ select public.toggle_wish_reaction(
       'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
       'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', null, 'not-an-emoji'
     ) $$,
  '22023',
  'INVALID_REACTION_EMOJI',
  'The database rejects non-canonical emoji values'
);

select results_eq(
  $$ select allowed, remaining
     from public.consume_reaction_rate_limit(repeat('a', 64), 2, 60) $$,
  $$ values (true, 1) $$,
  'First durable rate-limit request is allowed'
);

select results_eq(
  $$ select allowed, remaining
     from public.consume_reaction_rate_limit(repeat('a', 64), 2, 60) $$,
  $$ values (true, 0) $$,
  'Second durable rate-limit request is allowed'
);

select results_eq(
  $$ select allowed, remaining
     from public.consume_reaction_rate_limit(repeat('a', 64), 2, 60) $$,
  $$ values (false, 0) $$,
  'Atomic durable counter rejects the limit-plus-one request'
);

reset role;

insert into private.reaction_rate_limits (
  scope_hash, request_count, window_started_at, expires_at
)
values (
  repeat('b', 64), 1, pg_catalog.now() - interval '2 minutes', pg_catalog.now() - interval '1 minute'
);

set role service_role;

select public.consume_reaction_rate_limit(repeat('c', 64), 1, 60);

select is_empty(
  $$ select 1 from private.reaction_rate_limits where scope_hash = repeat('b', 64) $$,
  'Expired limiter rows are cleaned automatically'
);

reset role;
select * from finish();

rollback;
