-- RM26 P0-T04: public/unlisted pages are exact-slug server renders, not a
-- browser-queryable Data API projection.

revoke all on public.public_wishes_view from public, anon, authenticated;
revoke all on public.events, public.wishes, public.wish_media from anon;

drop policy if exists "public can read public wall events" on public.events;
drop policy if exists "public can read approved public wall wishes" on public.wishes;
drop policy if exists "public can read approved media" on public.wish_media;

-- Realtime is an invalidation channel only. The client receives event and wish
-- identifiers, then refetches the allowlisted projection through a Server Action.
create or replace function private.trg_wishes_realtime_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_approved boolean;
  v_was_approved boolean;
begin
  if tg_op = 'DELETE' then
    v_was_approved := old.moderation_status = 'approved' and old.deleted_at is null;
    v_is_approved := false;
  elsif tg_op = 'UPDATE' then
    v_was_approved := old.moderation_status = 'approved' and old.deleted_at is null;
    v_is_approved := new.moderation_status = 'approved' and new.deleted_at is null;
  else
    v_was_approved := false;
    v_is_approved := new.moderation_status = 'approved' and new.deleted_at is null;
  end if;

  if v_is_approved then
    insert into public.realtime_wall_events (event_id, wish_id, action)
    values (new.event_id, new.id, 'upsert');
  elsif v_was_approved then
    insert into public.realtime_wall_events (event_id, wish_id, action)
    values (old.event_id, old.id, 'remove');
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.trg_wishes_realtime_event() from public, anon, authenticated, service_role;
