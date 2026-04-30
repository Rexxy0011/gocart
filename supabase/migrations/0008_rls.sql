-- Row-Level Security: lock down every table with policies that match how
-- the app actually uses them. Service-role keys (lib/supabase/admin.js)
-- bypass RLS automatically, so admin actions keep working without explicit
-- admin policies.
--
-- Run this AFTER 0006 (adds products.removed_at) AND 0007 (boost_orders).
-- Once applied, the anon key (which ships in the browser bundle) can no
-- longer read or write arbitrary rows — every query has to satisfy a
-- policy below.
--
-- Convention used here:
--   - PUBLIC SELECT means signed-out browsing must work (e.g. /shop, /services)
--   - OWNER WRITE means auth.uid() must match the row's user_id (or the
--     row's store's user_id for products)
--   - Sensitive tables (boost_orders, addresses, provider_applications,
--     reports, conversations, messages) are locked to their participants
--
-- Every policy uses `drop ... if exists` first so the migration is safe
-- to re-run.

-- =====================================================================
-- profiles
-- =====================================================================
-- Names/avatars are public so they can render on listings, messages,
-- vendor cards. Users can only modify their own row. INSERT is handled
-- by the handle_new_user trigger (security definer) on auth.users insert.
alter table public.profiles enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
    for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
    for delete using (auth.uid() = id);

-- =====================================================================
-- stores
-- =====================================================================
-- Public sees approved + active stores. Owner sees their own at any
-- status (so the dashboard can show a pending banner). Insert is the
-- lazy-create flow on first post — must claim your own user_id. Status
-- field can only be flipped by service-role (admin approval).
alter table public.stores enable row level security;

drop policy if exists stores_select_public on public.stores;
create policy stores_select_public on public.stores
    for select using (
        (status = 'approved' and is_active = true)
        or auth.uid() = user_id
    );

drop policy if exists stores_insert_own on public.stores;
create policy stores_insert_own on public.stores
    for insert with check (auth.uid() = user_id);

drop policy if exists stores_update_own on public.stores;
create policy stores_update_own on public.stores
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists stores_delete_own on public.stores;
create policy stores_delete_own on public.stores
    for delete using (auth.uid() = user_id);

-- =====================================================================
-- products
-- =====================================================================
-- Public sees products whose store is approved+active AND removed_at
-- is null. Owner sees own products at any state. Writes require owning
-- the store the product belongs to.
alter table public.products enable row level security;

drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products
    for select using (
        (
            removed_at is null
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

drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products
    for insert with check (
        exists (
            select 1 from public.stores s
            where s.id = products.store_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products
    for update using (
        exists (
            select 1 from public.stores s
            where s.id = products.store_id
              and s.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.stores s
            where s.id = products.store_id
              and s.user_id = auth.uid()
        )
    );

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products
    for delete using (
        exists (
            select 1 from public.stores s
            where s.id = products.store_id
              and s.user_id = auth.uid()
        )
    );

-- =====================================================================
-- addresses
-- =====================================================================
-- Strictly private. Each user only sees their own.
alter table public.addresses enable row level security;

drop policy if exists addresses_select_own on public.addresses;
create policy addresses_select_own on public.addresses
    for select using (auth.uid() = user_id);

drop policy if exists addresses_insert_own on public.addresses;
create policy addresses_insert_own on public.addresses
    for insert with check (auth.uid() = user_id);

drop policy if exists addresses_update_own on public.addresses;
create policy addresses_update_own on public.addresses
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists addresses_delete_own on public.addresses;
create policy addresses_delete_own on public.addresses
    for delete using (auth.uid() = user_id);

-- =====================================================================
-- orders + order_items
-- =====================================================================
-- Buyer or seller sees the order. Only the buyer can insert. Updates
-- (status changes) are seller-only via the store.
alter table public.orders enable row level security;

drop policy if exists orders_select_party on public.orders;
create policy orders_select_party on public.orders
    for select using (
        auth.uid() = user_id
        or exists (
            select 1 from public.stores s
            where s.id = orders.store_id and s.user_id = auth.uid()
        )
    );

drop policy if exists orders_insert_buyer on public.orders;
create policy orders_insert_buyer on public.orders
    for insert with check (auth.uid() = user_id);

drop policy if exists orders_update_seller on public.orders;
create policy orders_update_seller on public.orders
    for update using (
        exists (
            select 1 from public.stores s
            where s.id = orders.store_id and s.user_id = auth.uid()
        )
    );

alter table public.order_items enable row level security;

drop policy if exists order_items_select_party on public.order_items;
create policy order_items_select_party on public.order_items
    for select using (
        exists (
            select 1 from public.orders o
            where o.id = order_items.order_id
              and (
                  o.user_id = auth.uid()
                  or exists (select 1 from public.stores s where s.id = o.store_id and s.user_id = auth.uid())
              )
        )
    );

drop policy if exists order_items_insert_buyer on public.order_items;
create policy order_items_insert_buyer on public.order_items
    for insert with check (
        exists (
            select 1 from public.orders o
            where o.id = order_items.order_id and o.user_id = auth.uid()
        )
    );

-- =====================================================================
-- ratings
-- =====================================================================
-- Public reads (so /product/[id] shows reviews). Only logged-in users
-- can write, and only as themselves. (Tying review-write to a confirmed
-- order/job comes in the bilateral-confirmation phase.)
alter table public.ratings enable row level security;

drop policy if exists ratings_select_public on public.ratings;
create policy ratings_select_public on public.ratings
    for select using (true);

drop policy if exists ratings_insert_own on public.ratings;
create policy ratings_insert_own on public.ratings
    for insert with check (auth.uid() = user_id);

drop policy if exists ratings_update_own on public.ratings;
create policy ratings_update_own on public.ratings
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists ratings_delete_own on public.ratings;
create policy ratings_delete_own on public.ratings
    for delete using (auth.uid() = user_id);

-- =====================================================================
-- coupons
-- =====================================================================
-- Public reads. Mutations only via service-role (admin).
alter table public.coupons enable row level security;

drop policy if exists coupons_select_public on public.coupons;
create policy coupons_select_public on public.coupons
    for select using (true);

-- =====================================================================
-- conversations
-- =====================================================================
-- Only the two parties to the conversation can read it. Buyer creates
-- it (auth.uid() = buyer_id). last_message_at gets bumped via the
-- bump_conversation_after_message trigger (security definer), so the
-- update path doesn't need a UPDATE policy for users.
alter table public.conversations enable row level security;

drop policy if exists conversations_select_party on public.conversations;
create policy conversations_select_party on public.conversations
    for select using (
        auth.uid() = buyer_id or auth.uid() = seller_id
    );

drop policy if exists conversations_insert_buyer on public.conversations;
create policy conversations_insert_buyer on public.conversations
    for insert with check (auth.uid() = buyer_id);

-- =====================================================================
-- messages
-- =====================================================================
-- Only conversation participants can read. Senders can only insert as
-- themselves and only into conversations they're part of.
alter table public.messages enable row level security;

drop policy if exists messages_select_party on public.messages;
create policy messages_select_party on public.messages
    for select using (
        exists (
            select 1 from public.conversations c
            where c.id = messages.conversation_id
              and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
        )
    );

drop policy if exists messages_insert_party on public.messages;
create policy messages_insert_party on public.messages
    for insert with check (
        auth.uid() = sender_id
        and exists (
            select 1 from public.conversations c
            where c.id = messages.conversation_id
              and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)
        )
    );

-- =====================================================================
-- provider_applications
-- =====================================================================
-- Applicant sees + writes their own row. Admin review uses service-role.
alter table public.provider_applications enable row level security;

drop policy if exists provider_apps_select_own on public.provider_applications;
create policy provider_apps_select_own on public.provider_applications
    for select using (auth.uid() = user_id);

drop policy if exists provider_apps_insert_own on public.provider_applications;
create policy provider_apps_insert_own on public.provider_applications
    for insert with check (auth.uid() = user_id);

drop policy if exists provider_apps_update_own on public.provider_applications;
create policy provider_apps_update_own on public.provider_applications
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- reports
-- =====================================================================
-- Reporter sees their own reports. Admin queue uses service-role. Anyone
-- signed in can file a report (about any listing).
alter table public.reports enable row level security;

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
    for select using (auth.uid() = reporter_id);

drop policy if exists reports_insert_signed_in on public.reports;
create policy reports_insert_signed_in on public.reports
    for insert with check (auth.uid() = reporter_id);

-- =====================================================================
-- boost_orders
-- =====================================================================
-- Owner-only. Insert happens in the server action, callback updates by
-- reference using the user's session — both go through these policies.
alter table public.boost_orders enable row level security;

drop policy if exists boost_orders_select_own on public.boost_orders;
create policy boost_orders_select_own on public.boost_orders
    for select using (auth.uid() = user_id);

drop policy if exists boost_orders_insert_own on public.boost_orders;
create policy boost_orders_insert_own on public.boost_orders
    for insert with check (auth.uid() = user_id);

drop policy if exists boost_orders_update_own on public.boost_orders;
create policy boost_orders_update_own on public.boost_orders
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
