-- RM26 P0-T03: keep reaction writes behind a fixed, service-only command.
-- This migration is intentionally forward-only; the original reaction migration
-- is already applied in existing environments.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

-- The counter stores only a server-created HMAC scope, never an IP address,
-- session identifier, or actor identifier in plaintext.
create table if not exists private.reaction_rate_limits (
  scope_hash text primary key check (scope_hash ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  check (expires_at > window_started_at)
);

create index if not exists reaction_rate_limits_expiry_idx
  on private.reaction_rate_limits (expires_at);

alter table private.reaction_rate_limits enable row level security;
revoke all on table private.reaction_rate_limits from public, anon, authenticated, service_role;

-- The original reaction policy was permissive. Service role bypasses RLS, and
-- no client role has table grants, so the table needs no policy at all.
drop policy if exists "Service role has full access to wish_reactions"
  on public.wish_reactions;

-- A core-schema predecessor used a narrower anonymous emoji CHECK. Drop only
-- legacy CHECK constraints whose definition references emoji; the actor/XOR
-- constraint and unique indexes remain untouched.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select constraint_name
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'wish_reactions'
      and constraint_type = 'CHECK'
      and pg_catalog.pg_get_constraintdef(
        (
          select oid
          from pg_catalog.pg_constraint
          where conrelid = 'public.wish_reactions'::pg_catalog.regclass
            and conname = information_schema.table_constraints.constraint_name
        )
      ) ilike '%emoji%'
  loop
    execute pg_catalog.format(
      'alter table public.wish_reactions drop constraint %I',
      v_constraint.constraint_name
    );
  end loop;
end;
$$;

-- Enforce the same canonical emoji contract as the UI/API for all future rows.
-- NOT VALID preserves historical rows while still enforcing every new write.
alter table public.wish_reactions
  add constraint wish_reactions_canonical_emoji_check
  check (emoji = any (array['❤️', '👍', '🎉', '😂', '🔥', '👏']::text[]))
  not valid;

create or replace function public.consume_reaction_rate_limit(
  p_scope_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_request_count integer;
  v_expires_at timestamptz;
begin
  if p_scope_hash !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_RATE_LIMIT_SCOPE';
  end if;

  if p_limit < 1 or p_limit > 100 or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_RATE_LIMIT_CONFIGURATION';
  end if;

  -- Bound cleanup work per request so expired rows disappear automatically
  -- without turning a hot path into a table-wide delete.
  with expired as (
    select ctid
    from private.reaction_rate_limits
    where expires_at <= v_now
    order by expires_at
    limit 100
  )
  delete from private.reaction_rate_limits as counter
  using expired
  where counter.ctid = expired.ctid;

  insert into private.reaction_rate_limits as counter (
    scope_hash,
    request_count,
    window_started_at,
    expires_at
  )
  values (
    p_scope_hash,
    1,
    v_now,
    v_now + (p_window_seconds * interval '1 second')
  )
  on conflict (scope_hash) do update
  set
    request_count = case
      when counter.expires_at <= v_now then 1
      else counter.request_count + 1
    end,
    window_started_at = case
      when counter.expires_at <= v_now then v_now
      else counter.window_started_at
    end,
    expires_at = case
      when counter.expires_at <= v_now then v_now + (p_window_seconds * interval '1 second')
      else counter.expires_at
    end
  returning counter.request_count, counter.expires_at
    into v_request_count, v_expires_at;

  return query
  select
    v_request_count <= p_limit,
    pg_catalog.greatest(p_limit - v_request_count, 0),
    v_expires_at;
end;
$$;

create or replace function public.toggle_wish_reaction(
  p_wish_id uuid,
  p_actor_id uuid,
  p_actor_key_hash text,
  p_emoji text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_id uuid;
begin
  if (p_actor_id is not null and p_actor_key_hash is not null)
     or (p_actor_id is null and p_actor_key_hash is null) then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_ACTOR';
  end if;

  if p_actor_key_hash is not null and p_actor_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_ACTOR';
  end if;

  if p_emoji <> all (array['❤️', '👍', '🎉', '😂', '🔥', '👏']::text[]) then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_EMOJI';
  end if;

  -- Serialize the same actor/wish/emoji tuple. The unique indexes remain a
  -- second line of defense, while this lock gives concurrent toggles a stable
  -- final state (two toggles result in no reaction).
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_wish_id::text || ':' || coalesce(p_actor_id::text, p_actor_key_hash) || ':' || p_emoji,
      0
    )
  );

  -- The lock protects the eligibility snapshot from concurrent moderation,
  -- archive, or delete changes until this short transaction finishes.
  perform 1
  from public.wishes as wish
  join public.events as event on event.id = wish.event_id
  where wish.id = p_wish_id
    and wish.moderation_status = 'approved'
    and wish.deleted_at is null
    and event.deleted_at is null
    and event.archived_at is null
    and event.visibility in ('public', 'unlisted')
  for share of wish, event;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'REACTION_TARGET_UNAVAILABLE';
  end if;

  if p_actor_id is not null then
    delete from public.wish_reactions
    where wish_id = p_wish_id
      and actor_id = p_actor_id
      and emoji = p_emoji
    returning id into v_existing_id;
  else
    delete from public.wish_reactions
    where wish_id = p_wish_id
      and actor_key_hash = p_actor_key_hash
      and emoji = p_emoji
    returning id into v_existing_id;
  end if;

  if v_existing_id is not null then
    return false;
  end if;

  insert into public.wish_reactions (
    wish_id,
    actor_id,
    actor_key_hash,
    emoji
  )
  values (
    p_wish_id,
    p_actor_id,
    p_actor_key_hash,
    p_emoji
  );

  return true;
end;
$$;

-- Data API and RLS are separate controls. Only the server's service role may
-- invoke these security-definer commands; public clients retain no direct path.
revoke all on function public.consume_reaction_rate_limit(text, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.consume_reaction_rate_limit(text, integer, integer)
  to service_role;

revoke all on function public.toggle_wish_reaction(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.toggle_wish_reaction(uuid, uuid, text, text)
  to service_role;
