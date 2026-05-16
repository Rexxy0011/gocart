-- Free VIN history report - phase 1.
--
-- Three changes:
--
-- 1. products.vin   : the actual VIN typed by the seller. Nullable
--                     because not every product is a vehicle.
-- 2. vin_reports    : cached NHTSA decode + recalls per VIN. Same VIN
--                     listed twice doesn't trigger two API calls; we
--                     refresh after 30 days.
-- 3. vehicle_history: append-only log of every time a VIN was listed,
--                     storing the seller-declared mileage at that
--                     moment. Future listings comparing against this
--                     log surface mileage rollbacks.

-- 1. VIN column on products -----------------------------------------------
alter table public.products
    add column if not exists vin text;

-- 17-char ISO 3779 format. Allow null (non-vehicles), reject anything else.
alter table public.products
    drop constraint if exists products_vin_format;
alter table public.products
    add constraint products_vin_format
    check (vin is null or (length(vin) = 17 and vin ~ '^[A-HJ-NPR-Z0-9]{17}$'));

create index if not exists products_vin_idx
    on public.products(vin) where vin is not null;

-- 2. vin_reports ---------------------------------------------------------
create table if not exists public.vin_reports (
    vin              text primary key
        check (length(vin) = 17 and vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
    decoded          jsonb not null default '{}',
    recalls          jsonb not null default '[]',
    last_checked_at  timestamptz not null default now(),
    created_at       timestamptz not null default now()
);

create index if not exists vin_reports_checked_idx
    on public.vin_reports(last_checked_at);

alter table public.vin_reports enable row level security;

-- Anyone can read VIN reports - they're attached to public listings.
drop policy if exists vin_reports_public_read on public.vin_reports;
create policy vin_reports_public_read on public.vin_reports
    for select using (true);

-- Writes go through the server action with admin client; no insert/update
-- policy means RLS denies direct client writes. Good - sellers shouldn't
-- forge a "0 recalls" report by writing the row themselves.

-- 3. vehicle_history -----------------------------------------------------
create table if not exists public.vehicle_history (
    id            uuid primary key default gen_random_uuid(),
    vin           text not null
        check (length(vin) = 17 and vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
    listing_id    uuid references public.products(id) on delete set null,
    mileage_miles integer check (mileage_miles is null or mileage_miles >= 0),
    recorded_at   timestamptz not null default now()
);

create index if not exists vehicle_history_vin_idx
    on public.vehicle_history(vin, recorded_at desc);

alter table public.vehicle_history enable row level security;

drop policy if exists vehicle_history_public_read on public.vehicle_history;
create policy vehicle_history_public_read on public.vehicle_history
    for select using (true);
-- Writes go through the server action only.
