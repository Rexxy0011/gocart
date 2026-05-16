-- Saved listings ("favorites"). One row per (user, listing) pair - the
-- heart toggle on listing cards. app/actions/favorites.js toggles rows
-- here and app/layout.jsx reads them on every request to hydrate the
-- favorites slice.
--
-- This migration both CREATES the table and locks it down - it runs
-- after 0008_rls.sql, which predates the table and therefore has no
-- policy for it. Without the policies below the anon key (shipped in the
-- browser bundle) could read or delete anyone's favorites.

create table if not exists public.favorites (
    user_id     uuid not null references public.profiles(id) on delete cascade,
    product_id  uuid not null references public.products(id) on delete cascade,
    created_at  timestamptz not null default now(),
    -- Composite PK: a listing is either saved or not - no duplicates.
    -- toggleFavorite() relies on at most one row per (user, listing).
    primary key (user_id, product_id)
);

-- Per-product lookups (e.g. "how many saved this listing") aren't done
-- yet; the PK index on (user_id, product_id) already covers every query
-- the app makes today (both are user-scoped via RLS).

-- =====================================================================
-- RLS - a user may only see and mutate their own saved listings.
-- =====================================================================
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
