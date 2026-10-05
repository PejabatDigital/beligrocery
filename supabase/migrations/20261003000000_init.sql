-- Beli Grocery: initial schema.
-- Every table is scoped by user_id with row-level security: users only ever see their own rows.
-- user_id defaults to auth.uid(), so the client never sends it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  shopping_for  text not null check (char_length(shopping_for) between 1 and 60),
  cadence_days  int  not null default 14 check (cadence_days between 1 and 90),
  created_at    timestamptz not null default now()
);

create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  canonical_name  text not null check (char_length(canonical_name) between 1 and 120),
  category        text not null check (category in ('protein', 'produce', 'dairy', 'pantry')),
  aliases         text[] not null default '{}',
  created_at      timestamptz not null default now()
);
create unique index items_user_name_key on public.items (user_id, lower(canonical_name));

create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  order_date  date not null,
  total_rm    numeric(10, 2) check (total_rm is null or total_rm >= 0),
  raw_text    text not null default '',
  created_at  timestamptz not null default now()
);
create index orders_user_date_idx on public.orders (user_id, order_date);

-- order_items carries user_id too, so it can be scoped by RLS like every other table.
create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  order_id   uuid not null references public.orders (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete restrict,
  quantity   numeric(10, 2) check (quantity is null or quantity > 0),
  unit       text,
  amount_rm  numeric(10, 2) check (amount_rm is null or amount_rm >= 0),
  raw_line   text not null default ''
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_item_idx on public.order_items (item_id);

-- One row per call to /api/parse-order, for per-user rate limiting.
create table public.parse_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index parse_requests_user_time_idx on public.parse_requests (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.items          enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.parse_requests enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own items" on public.items
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own orders" on public.orders
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Lines must belong to the user's own order and the user's own item.
create policy "own order items" on public.order_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
  );

-- Users can log and count their own parse requests, but not delete them (that would reset the limit).
create policy "insert own parse requests" on public.parse_requests
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "read own parse requests" on public.parse_requests
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- save_order: one transaction for an order, its lines, new items and new aliases.
-- security invoker, so RLS still applies to every statement.
--
-- payload: { order_date, total_rm, raw_text,
--            lines: [{ item_id | null, name, category, quantity, unit, amount_rm, raw_line }] }
-- ---------------------------------------------------------------------------

create or replace function public.save_order(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_line     jsonb;
  v_item_id  uuid;
  v_name     text;
begin
  if jsonb_array_length(coalesce(payload -> 'lines', '[]'::jsonb)) = 0 then
    raise exception 'An order needs at least one item';
  end if;

  insert into orders (order_date, total_rm, raw_text)
  values (
    (payload ->> 'order_date')::date,
    nullif(payload ->> 'total_rm', '')::numeric,
    coalesce(payload ->> 'raw_text', '')
  )
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(payload -> 'lines') loop
    v_name    := btrim(v_line ->> 'name');
    v_item_id := nullif(v_line ->> 'item_id', '')::uuid;

    if v_item_id is null then
      -- Reuse an item with the same name before creating one.
      select id into v_item_id from items where lower(canonical_name) = lower(v_name);
      if v_item_id is null then
        insert into items (canonical_name, category)
        values (v_name, v_line ->> 'category')
        returning id into v_item_id;
      end if;
    end if;

    -- Remember how this line was written, so it matches automatically next time.
    update items
       set aliases = array_append(aliases, v_name)
     where id = v_item_id
       and lower(canonical_name) <> lower(v_name)
       and not exists (select 1 from unnest(aliases) a where lower(a) = lower(v_name));

    insert into order_items (order_id, item_id, quantity, unit, amount_rm, raw_line)
    values (
      v_order_id,
      v_item_id,
      nullif(v_line ->> 'quantity', '')::numeric,
      nullif(v_line ->> 'unit', ''),
      nullif(v_line ->> 'amount_rm', '')::numeric,
      coalesce(v_line ->> 'raw_line', '')
    );
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.save_order(jsonb) from public, anon;
grant execute on function public.save_order(jsonb) to authenticated;
