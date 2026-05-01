-- Per-listing review pipeline. Replaces the old shop-level approval
-- workflow. Each listing now carries its own review_status:
--   pending  → in admin queue, hidden from buyers
--   approved → live and visible
--   rejected → admin removed (distinct from removed_at, which is the
--              soft-delete trigger from a user report)
--
-- New listings default to 'pending'. The auto_review_listing() trigger
-- below auto-flips them to 'approved' if the seller already has 3+
-- approved listings — Jiji-style account-age gate. New accounts spend
-- their first three listings in admin review, then auto-publish.
--
-- Shop-level approval is deprecated. Existing pending shops are flipped
-- to approved retroactively (the user picked this when we changed the
-- model). Rejected shops stay rejected.

-- =====================================================================
-- 1. review_status column on products
-- =====================================================================
alter table public.products
    add column if not exists review_status   text not null default 'pending',
    add column if not exists reviewed_at     timestamptz,
    add column if not exists rejection_reason text;

-- Backfill: every product that exists today is grandfathered in. Without
-- this, all current listings would disappear from buyer feeds the moment
-- this migration applies.
update public.products
    set review_status = 'approved', reviewed_at = coalesce(reviewed_at, created_at)
    where review_status = 'pending';

create index if not exists products_review_status_idx
    on public.products(review_status, created_at desc);

-- =====================================================================
-- 2. Auto-approve trigger: account-age gate
-- =====================================================================
-- On insert, count this seller's prior approved listings. If they have
-- 3+, the new listing skips the admin queue and goes live instantly.
-- First-time and second-time posters get held for review.
--
-- Counts include any listing in any of the seller's stores (in case we
-- ever support multi-store accounts) — the join chain is product → store
-- → user_id.

create or replace function public.auto_review_listing()
returns trigger
security definer
set search_path = public
as $$
declare
    seller_id uuid;
    prior_count integer;
begin
    if (new.review_status = 'pending') then
        select s.user_id into seller_id from public.stores s where s.id = new.store_id;
        select count(*) into prior_count
            from public.products p
            join public.stores s on s.id = p.store_id
            where s.user_id = seller_id
              and p.review_status = 'approved';
        if prior_count >= 3 then
            new.review_status := 'approved';
            new.reviewed_at := now();
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists products_auto_review on public.products;
create trigger products_auto_review
    before insert on public.products
    for each row execute procedure public.auto_review_listing();

-- =====================================================================
-- 3. Stores default to approved (shop-level approval deprecated)
-- =====================================================================
alter table public.stores alter column status    set default 'approved';
alter table public.stores alter column is_active set default true;

-- Flip every still-pending shop to approved. Rejected shops stay rejected
-- so any prior admin actions are preserved.
update public.stores
    set status = 'approved', is_active = true
    where status = 'pending';

-- =====================================================================
-- 4. RLS policy update: products visibility now also gates on review_status
-- =====================================================================
-- Public sees: store approved+active AND removed_at null AND review_status='approved'.
-- Owner sees: every product they own at any state.
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
    for select using (
        (
            removed_at is null
            and review_status = 'approved'
            and exists (
                select 1 from public.stores s
                where s.id = products.store_id
                  and s.status = 'approved'
                  and s.is_active = true
            )
        )
        or exists (
            select 1 from public.stores s
            where s.id = products.store_id
              and s.user_id = auth.uid()
        )
    );
