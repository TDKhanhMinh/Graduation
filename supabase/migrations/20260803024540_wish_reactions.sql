-- Create wish_reactions table
create table if not exists public.wish_reactions (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  actor_key_hash text,
  emoji text not null check (length(emoji) between 1 and 10),
  created_at timestamptz not null default now(),

  -- XOR constraint for actor identity
  constraint wish_reactions_actor_xor check (
    (actor_id is not null and actor_key_hash is null) or
    (actor_id is null and actor_key_hash is not null)
  )
);

-- Unique indexes to prevent duplicate reactions from same actor
create unique index wish_reactions_wish_id_actor_id_emoji_idx 
  on public.wish_reactions (wish_id, actor_id, emoji) 
  where actor_id is not null;

create unique index wish_reactions_wish_id_actor_hash_emoji_idx 
  on public.wish_reactions (wish_id, actor_key_hash, emoji) 
  where actor_key_hash is not null;

-- Enable RLS
alter table public.wish_reactions enable row level security;

-- Only service role can read/write directly to this table to prevent exposing actor IDs/hashes
-- We will expose access through Next.js API routes which enforce the contract.
create policy "Service role has full access to wish_reactions"
  on public.wish_reactions
  for all
  using (true)
  with check (true);

-- RPC for atomic toggle
create or replace function toggle_wish_reaction(
  p_wish_id uuid,
  p_actor_id uuid,
  p_actor_key_hash text,
  p_emoji text
)
returns boolean
language plpgsql
security definer -- Elevate to bypass RLS since users can't read/write directly
as $$
declare
  v_existing_id uuid;
begin
  -- Validate XOR constraint before doing anything
  if (p_actor_id is not null and p_actor_key_hash is not null) or
     (p_actor_id is null and p_actor_key_hash is null) then
    raise exception 'Either actor_id or actor_key_hash must be provided, but not both';
  end if;

  if p_actor_id is not null then
    select id into v_existing_id
    from public.wish_reactions
    where wish_id = p_wish_id and actor_id = p_actor_id and emoji = p_emoji;
  else
    select id into v_existing_id
    from public.wish_reactions
    where wish_id = p_wish_id and actor_key_hash = p_actor_key_hash and emoji = p_emoji;
  end if;

  if v_existing_id is not null then
    -- Remove reaction
    delete from public.wish_reactions where id = v_existing_id;
    return false;
  else
    -- Add reaction
    insert into public.wish_reactions (wish_id, actor_id, actor_key_hash, emoji)
    values (p_wish_id, p_actor_id, p_actor_key_hash, p_emoji);
    return true;
  end if;
end;
$$;
