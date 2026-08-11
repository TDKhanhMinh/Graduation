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
  if p_scope_hash is null or p_scope_hash !~ '^[a-f0-9]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_RATE_LIMIT_SCOPE';
  end if;

  if p_limit < 1 or p_limit > 100 or p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception using
      errcode = '22023',
      message = 'INVALID_REACTION_RATE_LIMIT_CONFIGURATION';
  end if;

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
    greatest(p_limit - v_request_count, 0),
    v_expires_at;
end;
$$;
