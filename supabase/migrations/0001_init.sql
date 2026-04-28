-- GoCart initial schema. Translated from prisma/schema.prisma.
-- Uses snake_case (Postgres convention) and references auth.users for the user table.

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- Enums --------------------------------------------------------------------
create type order_status as enum ('ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED');
create type payment_method as enum ('COD', 'STRIPE', 'PAYSTACK');

-- Profiles -----------------------------------------------------------------
-- One row per auth.users row. Created via a trigger on signup.
create table public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    name        text not null,
    email       text not null,
    image       text,
    cart        jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Stores -------------------------------------------------------------------
create table public.stores (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null unique references public.profiles(id) on delete cascade,
    name         text not null,
    description  text not null,
    username     text not null unique,
    address      text not null,
    status       text not null default 'pending',  -- pending | approved | rejected
    is_active    boolean not null default false,
    logo         text not null,
    email        text not null,
    contact      text not null,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- Products -----------------------------------------------------------------
create table public.products (
    id           uuid primary key default gen_random_uuid(),
    store_id     uuid not null references public.stores(id) on delete cascade,
    name         text not null,
    description  text not null,
    mrp          numeric(12, 2) not null,
    price        numeric(12, 2) not null,
    images       text[] not null default '{}',
    category     text not null,
    in_stock     boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
create index products_store_id_idx on public.products(store_id);
create index products_category_idx on public.products(category);

-- Addresses ----------------------------------------------------------------
create table public.addresses (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    name        text not null,
    email       text not null,
    street      text not null,
    city        text not null,
    state       text not null,
    zip         text not null,
    country     text not null,
    phone       text not null,
    created_at  timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);

-- Orders -------------------------------------------------------------------
create table public.orders (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references public.profiles(id),
    store_id        uuid not null references public.stores(id),
    address_id      uuid not null references public.addresses(id),
    total           numeric(12, 2) not null,
    status          order_status not null default 'ORDER_PLACED',
    is_paid         boolean not null default false,
    payment_method  payment_method not null,
    is_coupon_used  boolean not null default false,
    coupon          jsonb not null default '{}'::jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);
create index orders_user_id_idx on public.orders(user_id);
create index orders_store_id_idx on public.orders(store_id);

-- Order items --------------------------------------------------------------
create table public.order_items (
    order_id    uuid not null references public.orders(id) on delete cascade,
    product_id  uuid not null references public.products(id),
    quantity    integer not null check (quantity > 0),
    price       numeric(12, 2) not null,
    primary key (order_id, product_id)
);

-- Ratings ------------------------------------------------------------------
create table public.ratings (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    product_id  uuid not null references public.products(id) on delete cascade,
    order_id    uuid not null references public.orders(id) on delete cascade,
    rating      integer not null check (rating between 1 and 5),
    review      text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (user_id, product_id, order_id)
);

-- Coupons ------------------------------------------------------------------
create table public.coupons (
    code         text primary key,
    description  text not null,
    discount     numeric(6, 2) not null,
    for_new_user boolean not null,
    for_member   boolean not null default false,
    is_public    boolean not null,
    expires_at   timestamptz not null,
    created_at   timestamptz not null default now()
);

-- updated_at trigger -------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger profiles_touch  before update on public.profiles  for each row execute procedure public.touch_updated_at();
create trigger stores_touch    before update on public.stores    for each row execute procedure public.touch_updated_at();
create trigger products_touch  before update on public.products  for each row execute procedure public.touch_updated_at();
create trigger orders_touch    before update on public.orders    for each row execute procedure public.touch_updated_at();
create trigger ratings_touch   before update on public.ratings   for each row execute procedure public.touch_updated_at();

-- Auto-create a profile row whenever a new auth user is created -----------
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, email, image)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', new.email),
        new.email,
        coalesce(new.raw_user_meta_data->>'image', '')
    );
    return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Row-Level Security: enable now, policies come in Phase 1 ----------------
-- Phase 1 will add policies. Until then RLS is OFF so dev queries work.
-- Uncomment per-table when you write its policies:
-- alter table public.profiles    enable row level security;
-- alter table public.stores      enable row level security;
-- alter table public.products    enable row level security;
-- alter table public.addresses   enable row level security;
-- alter table public.orders      enable row level security;
-- alter table public.order_items enable row level security;
-- alter table public.ratings     enable row level security;
-- alter table public.coupons     enable row level security;
