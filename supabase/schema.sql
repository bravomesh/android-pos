-- Cloud copy of the shop, for the owner's phone.
--
-- Run this once in your Supabase project: SQL Editor, New query, paste, Run.
-- It is safe to run again.
--
-- The tables cannot be read or written directly (row level security is on
-- and has no policies). Everything goes through the four functions below,
-- and each one needs the shop's sync code, a long random secret made on the
-- shop's phone. Only a fingerprint of the code is stored here.

create table if not exists shop_snapshots (
  shop text primary key,
  data text not null,
  updated_at timestamptz not null default now()
);

create table if not exists shop_photos (
  shop text not null,
  product_id bigint not null,
  photo text,
  updated_at timestamptz not null default now(),
  primary key (shop, product_id)
);

alter table shop_snapshots enable row level security;
alter table shop_photos enable row level security;

create or replace function shop_key(p_code text) returns text
language plpgsql immutable as $$
begin
  if p_code is null or length(p_code) < 24 then
    raise exception 'Sync code is too short';
  end if;
  return encode(sha256(convert_to(p_code, 'UTF8')), 'hex');
end $$;

create or replace function push_snapshot(p_code text, p_data text) returns timestamptz
language sql security definer set search_path = public as $$
  insert into shop_snapshots (shop, data, updated_at) values (shop_key(p_code), p_data, now())
  on conflict (shop) do update set data = excluded.data, updated_at = now()
  returning updated_at;
$$;

-- Nothing comes back unless there is something newer than p_since.
create or replace function pull_snapshot(p_code text, p_since timestamptz default null)
returns table (data text, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select s.data, s.updated_at from shop_snapshots s
  where s.shop = shop_key(p_code) and (p_since is null or s.updated_at > p_since);
$$;

create or replace function push_photo(p_code text, p_product_id bigint, p_photo text) returns timestamptz
language sql security definer set search_path = public as $$
  insert into shop_photos (shop, product_id, photo, updated_at) values (shop_key(p_code), p_product_id, p_photo, now())
  on conflict (shop, product_id) do update set photo = excluded.photo, updated_at = now()
  returning updated_at;
$$;

create or replace function pull_photos(p_code text, p_since timestamptz default null)
returns table (product_id bigint, photo text, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select p.product_id, p.photo, p.updated_at from shop_photos p
  where p.shop = shop_key(p_code) and (p_since is null or p.updated_at > p_since)
  order by p.updated_at;
$$;

grant execute on function push_snapshot(text, text) to anon;
grant execute on function pull_snapshot(text, timestamptz) to anon;
grant execute on function push_photo(text, bigint, text) to anon;
grant execute on function pull_photos(text, timestamptz) to anon;
