-- Extend the products table for classifieds use-cases.
--
-- The original 0001 schema was Prisma-translated for an e-commerce model
-- (mrp/price both required, no service/vehicle metadata, no boost flags).
-- Classifieds need: services with quote-on-request (nullable price), vehicles
-- with a rich spec blob, free giveaways, and per-listing boost state.

-- 1. New columns -----------------------------------------------------------

alter table public.products
    -- Universal classifieds metadata
    add column if not exists location           text,
    add column if not exists condition          text,        -- new | as-new | good | fair
    add column if not exists was_price          numeric(12, 2),  -- strikethrough price
    add column if not exists free               boolean not null default false,
    add column if not exists delivery_available boolean not null default false,

    -- Paid boost flags (per-listing pay-per-use). Each can carry an `_until`
    -- expiry once Paystack is wired; for now they're plain booleans.
    add column if not exists featured           boolean not null default false,
    add column if not exists urgent             boolean not null default false,
    add column if not exists urgency_reason     text,
    add column if not exists bulk_sale          boolean not null default false,
    add column if not exists bumped_at          timestamptz,

    -- Service listings (plumber, mechanic, etc.)
    add column if not exists service            jsonb,

    -- Vehicle listings — Year, Mileage, Body, Transmission, Fuel, etc.
    add column if not exists vehicle            jsonb;

-- 2. Make price + mrp nullable --------------------------------------------
-- Services with quote-on-request have no price. Most classifieds don't have
-- an MRP either.

alter table public.products
    alter column price drop not null,
    alter column mrp   drop not null,
    alter column description drop not null;

-- mrp is e-commerce vocabulary we no longer use — was_price covers the
-- strikethrough case. Keep mrp column for now (don't drop in case any test
-- data depends on it), just stop populating it.

-- 3. Indexes for the home / shop / search filters ------------------------

create index if not exists products_location_idx
    on public.products(location);

-- Compound index supporting the home-feed sort: featured first, then newest.
create index if not exists products_featured_recent_idx
    on public.products(featured desc, created_at desc);

-- Backfill location to a placeholder for any pre-existing rows so the NOT
-- NULL constraint can be added safely. (No-op on a fresh DB.)
update public.products set location = 'Lagos' where location is null;

alter table public.products
    alter column location set not null;
