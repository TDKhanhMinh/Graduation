create schema if not exists private;

revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (
      display_name is null
      or char_length(display_name) between 1 and 100
    ),
  constraint profiles_avatar_url_length
    check (
      avatar_url is null
      or char_length(avatar_url) <= 2048
    )
);

comment on table public.profiles is
  'Application profile data owned by the matching auth.users record.';

alter table public.profiles enable row level security;

grant usage on schema public to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;
revoke all on table public.profiles from anon;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(
      left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 100),
      ''
    ),
    nullif(
      left(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), 2048),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
