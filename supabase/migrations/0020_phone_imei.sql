-- Phone listings get the same care vehicles do:
--
-- 1. products.phone : JSONB blob mirroring products.vehicle. Holds
--                     brand, model, storage, RAM, colour, battery health,
--                     network lock, accessories, warranty.
-- 2. products.imei  : 15-digit GSMA IMEI typed by the seller. Optional
--                     for new-sealed phones, expected for used ones.
-- 3. imei_reports   : cached TAC decode + verification result per IMEI.
--                     Same caching strategy as vin_reports.
-- 4. phone_history  : append-only audit trail. Same IMEI listed twice on
--                     GoCart shows up here so buyers can spot rebadged
--                     stolen units the same way they'd catch a mileage
--                     rollback on a car.

-- 1. phone JSONB column ---------------------------------------------------
alter table public.products
    add column if not exists phone jsonb;

-- 2. IMEI column (15 digits, no formatting) -------------------------------
alter table public.products
    add column if not exists imei text;

alter table public.products
    drop constraint if exists products_imei_format;
alter table public.products
    add constraint products_imei_format
    check (imei is null or (length(imei) = 15 and imei ~ '^[0-9]{15}$'));

create index if not exists products_imei_idx
    on public.products(imei) where imei is not null;

-- 3. imei_reports ---------------------------------------------------------
create table if not exists public.imei_reports (
    imei             text primary key
        check (length(imei) = 15 and imei ~ '^[0-9]{15}$'),
    -- TAC-decoded brand / model / specs, plus our Luhn pass/fail.
    decoded          jsonb not null default '{}',
    last_checked_at  timestamptz not null default now(),
    created_at       timestamptz not null default now()
);

create index if not exists imei_reports_checked_idx
    on public.imei_reports(last_checked_at);

alter table public.imei_reports enable row level security;

drop policy if exists imei_reports_public_read on public.imei_reports;
create policy imei_reports_public_read on public.imei_reports
    for select using (true);
-- Writes go through the server action with admin client. Sellers can't
-- forge a "verified iPhone 15" report by writing the row directly.

-- 4. phone_history --------------------------------------------------------
create table if not exists public.phone_history (
    id              uuid primary key default gen_random_uuid(),
    imei            text not null
        check (length(imei) = 15 and imei ~ '^[0-9]{15}$'),
    listing_id      uuid references public.products(id) on delete set null,
    -- Condition the seller claimed at this listing - useful when a phone
    -- is re-listed: a "Brand new (sealed)" today after a "Nigerian used"
    -- six months ago is a red flag.
    claimed_condition text,
    recorded_at     timestamptz not null default now()
);

create index if not exists phone_history_imei_idx
    on public.phone_history(imei, recorded_at desc);

alter table public.phone_history enable row level security;

drop policy if exists phone_history_public_read on public.phone_history;
create policy phone_history_public_read on public.phone_history
    for select using (true);
-- Writes server-side only.
