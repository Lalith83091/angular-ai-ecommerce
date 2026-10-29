create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id text not null check (char_length(product_id) between 1 and 100),
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_cart_product_unique unique (cart_id, product_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null check (char_length(product_id) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint wishlists_user_product_unique unique (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'placed' check (status in ('placed', 'confirmed', 'fulfilled', 'cancelled')),
  customer_name text not null check (char_length(trim(customer_name)) between 1 and 120),
  email text not null check (char_length(trim(email)) between 3 and 320),
  address_line1 text not null check (char_length(trim(address_line1)) between 1 and 200),
  address_line2 text not null default '' check (char_length(address_line2) <= 200),
  city text not null check (char_length(trim(city)) between 1 and 120),
  state_region text not null default '' check (char_length(state_region) <= 120),
  postal_code text not null check (char_length(trim(postal_code)) between 1 and 32),
  country text not null check (char_length(trim(country)) between 2 and 120),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  created_at timestamptz not null default now(),
  constraint orders_total_matches_breakdown check (total_amount = subtotal + shipping_amount)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null check (char_length(product_id) between 1 and 100),
  product_name text not null check (char_length(trim(product_name)) between 1 and 200),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now(),
  constraint order_items_order_product_unique unique (order_id, product_id)
);

create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc);
create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.carts, public.cart_items, public.wishlists,
  public.orders, public.order_items from public, anon, authenticated;

grant select, insert, update, delete on table public.carts,
  public.cart_items, public.wishlists to authenticated;
grant select, insert on table public.orders, public.order_items to authenticated;

drop policy if exists "Users manage their own cart" on public.carts;
create policy "Users manage their own cart"
  on public.carts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage items in their own cart" on public.cart_items;
create policy "Users manage items in their own cart"
  on public.cart_items for all to authenticated
  using (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users manage their own wishlist" on public.wishlists;
create policy "Users manage their own wishlist"
  on public.wishlists for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their own orders" on public.orders;
create policy "Users read their own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own placed orders" on public.orders;
create policy "Users create their own placed orders"
  on public.orders for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'placed'
  );

drop policy if exists "Users read items in their own orders" on public.order_items;
create policy "Users read items in their own orders"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users add items only to their own placed orders" on public.order_items;
create policy "Users add items only to their own placed orders"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
        and orders.status = 'placed'
    )
  );
