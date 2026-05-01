-- Buyer favorites — the heart icon on listings. Persisted server-side so
-- saves survive across devices and sessions. The Redux slice that the UI
-- already uses gets hydrated from this table on every page load when a
-- user is signed in; signed-out hearts open the auth gate.
--
-- Composite primary key keeps each (user, listing) pair unique without
-- needing a separate id column or a unique constraint.

create table if not exists public.favorites (
    user_id    uuid not null references public.profiles(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, product_id)
);

create index if not exists favorites_user_idx
    on public.favorites(user_id, created_at desc);
create index if not exists favorites_product_idx
    on public.favorites(product_id);

-- RLS — strictly owner-only.
alter table public.favorites enable row level security;

drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
    for select using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
    for insert with check (auth.uid() = user_id);

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
    for delete using (auth.uid() = user_id);
