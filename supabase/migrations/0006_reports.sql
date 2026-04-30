-- Reactive moderation: anyone authenticated can report a listing; admins
-- review the queue at /admin/reports. Two outcomes:
--
--   dismiss → close the report, leave the listing live
--   action  → mark the listing removed (products.removed_at = now()) +
--             close the report. Buyer-facing queries filter this out.
--
-- We don't auto-remove on N reports — admin always decides. Keeps moderation
-- bias-free and avoids report-bombing as a takedown vector.

-- 1. Reports table --------------------------------------------------------

create table if not exists public.reports (
    id           uuid primary key default gen_random_uuid(),
    reporter_id  uuid not null references public.profiles(id) on delete cascade,
    listing_id   uuid not null references public.products(id) on delete cascade,
    reason       text not null,
    description  text,
    -- open | reviewed | actioned | dismissed
    status       text not null default 'open',
    admin_note   text,
    resolved_at  timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status, created_at);
create index if not exists reports_listing_idx on public.reports(listing_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

drop trigger if exists reports_touch on public.reports;
create trigger reports_touch
    before update on public.reports
    for each row execute procedure public.touch_updated_at();

-- 2. Soft-removal column on products -------------------------------------
-- Hard delete would cascade-kill the conversations attached to a listing.
-- Soft removal keeps the audit trail and lets buyer-facing queries filter
-- with a single `removed_at is null` clause.

alter table public.products
    add column if not exists removed_at timestamptz;

create index if not exists products_removed_at_idx
    on public.products(removed_at);
