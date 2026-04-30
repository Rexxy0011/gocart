-- Paystack-backed boost purchases. Every "Bump", "Featured", "Urgent", etc.
-- click hits Paystack — we record the transaction here for idempotency and
-- audit. Boost is only applied to the listing after Paystack verifies the
-- charge succeeded, so a half-paid attempt never silently activates.
--
-- For the buyer-side filter rules, listings are "actively boosted" when the
-- corresponding *_until column is in the future. The legacy boolean flags
-- (featured / urgent / bulk_sale) are kept for now as "intent" markers but
-- the timestamps are the source of truth going forward.

-- 1. boost_orders --------------------------------------------------------

create table if not exists public.boost_orders (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references public.profiles(id) on delete cascade,
    listing_id    uuid not null references public.products(id) on delete cascade,
    -- bump | featured | urgent | bulk_sale | bundle
    boost_key     text not null,
    amount_kobo   integer not null check (amount_kobo > 0),
    -- Paystack returns this on /transaction/initialize. We store it before
    -- redirecting to Paystack so the callback can find the row by ref alone.
    reference     text not null unique,
    -- pending | paid | failed | abandoned
    status        text not null default 'pending',
    paid_at       timestamptz,
    metadata      jsonb,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create index if not exists boost_orders_user_idx
    on public.boost_orders(user_id, created_at desc);
create index if not exists boost_orders_listing_idx
    on public.boost_orders(listing_id);
create index if not exists boost_orders_status_idx
    on public.boost_orders(status, created_at);

drop trigger if exists boost_orders_touch on public.boost_orders;
create trigger boost_orders_touch
    before update on public.boost_orders
    for each row execute procedure public.touch_updated_at();

-- 2. *_until expiry timestamps on products -------------------------------
-- "Boost is active" = column > now(). Cron later flips the legacy boolean
-- flags to false when these expire; for now buyer-side queries can sort /
-- filter on the timestamps directly when we wire the rest of the boosts.

alter table public.products
    add column if not exists bumped_until     timestamptz,
    add column if not exists featured_until   timestamptz,
    add column if not exists urgent_until     timestamptz,
    add column if not exists bulk_sale_until  timestamptz;

create index if not exists products_bumped_until_idx
    on public.products(bumped_until) where bumped_until is not null;
create index if not exists products_featured_until_idx
    on public.products(featured_until) where featured_until is not null;
