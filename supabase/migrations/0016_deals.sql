-- Phase 3: bilateral deal/job confirmation primitive.
--
-- Every conversation between a buyer and seller can carry one "deal".
-- Either side can claim "this is done"; the other side then confirms,
-- disputes, or stays silent. Only when BOTH sides confirm does the
-- deal flip to `verified` — at which point the buyer gets prompted to
-- leave a review, and that review carries a "Verified job" badge that
-- drive-by reviews don't have.
--
-- Why this matters: drive-by reviews from drive-by accounts are easy
-- to spam. A bilateral confirmation requires the seller to actively
-- agree the deal happened — much harder to fake at scale, and disputes
-- (one says yes, other says no) become a clear signal we can surface.

-- 1. deals table -----------------------------------------------------------
create table if not exists public.deals (
    id                uuid primary key default gen_random_uuid(),
    -- One deal per conversation. The conversation thread IS the deal,
    -- and the unique constraint prevents accidental duplicates if both
    -- sides race to mark done.
    conversation_id   uuid not null unique references public.conversations(id) on delete cascade,
    listing_id        uuid not null references public.products(id) on delete cascade,
    buyer_id          uuid not null references public.profiles(id) on delete cascade,
    seller_id         uuid not null references public.profiles(id) on delete cascade,

    -- open           : neither party has acted
    -- pending_seller : buyer marked done first; awaiting seller
    -- pending_buyer  : seller marked done first; awaiting buyer
    -- verified       : both confirmed; buyer can leave a verified review
    -- disputed       : one party explicitly declined the other's mark
    status            text not null default 'open',

    buyer_marked_at   timestamptz,
    seller_marked_at  timestamptz,
    verified_at       timestamptz,
    disputed_at       timestamptz,
    disputed_by       uuid references public.profiles(id) on delete set null,
    dispute_reason    text,

    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),

    constraint deals_status_valid
        check (status in ('open','pending_seller','pending_buyer','verified','disputed'))
);

create index if not exists deals_listing_idx       on public.deals(listing_id);
create index if not exists deals_buyer_idx         on public.deals(buyer_id);
create index if not exists deals_seller_idx        on public.deals(seller_id);
create index if not exists deals_status_idx        on public.deals(status);
create index if not exists deals_verified_at_idx   on public.deals(verified_at)
    where status = 'verified';

drop trigger if exists deals_touch on public.deals;
create trigger deals_touch
    before update on public.deals
    for each row execute procedure public.touch_updated_at();

-- 2. RLS -------------------------------------------------------------------
-- Only the two participants in a deal can read or write it. Server
-- actions still go through the regular Supabase client; the admin client
-- bypasses RLS for moderation queues.
alter table public.deals enable row level security;

drop policy if exists deals_select_participants on public.deals;
create policy deals_select_participants on public.deals
    for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists deals_insert_participants on public.deals;
create policy deals_insert_participants on public.deals
    for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists deals_update_participants on public.deals;
create policy deals_update_participants on public.deals
    for update using (auth.uid() = buyer_id or auth.uid() = seller_id)
    with check (auth.uid() = buyer_id or auth.uid() = seller_id);

-- 3. Tie reviews to deals --------------------------------------------------
-- Optional FK on ratings → deals. When a review is left from a verified
-- deal flow, it's stamped with the deal id and renders a "Verified job"
-- badge in the UI. Drive-by reviews (from /shop/[username]) leave deal_id
-- null and render as plain reviews.
alter table public.ratings
    add column if not exists deal_id uuid references public.deals(id) on delete set null;

create index if not exists ratings_deal_idx
    on public.ratings(deal_id) where deal_id is not null;
