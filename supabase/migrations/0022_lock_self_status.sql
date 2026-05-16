-- Close two RLS holes where a user could promote their own record.
--
-- 0008_rls.sql scoped provider_applications and stores writes to the owner
-- (auth.uid() = user_id) but never restricted *which columns / values* the
-- owner may write. So a user could update their own row and set
-- status = 'approved', self-granting provider access / a live store -
-- bypassing admin review entirely.
--
-- Admin approval runs through the service-role client (app/actions/admin.js),
-- which bypasses RLS and column grants, so none of the below affects it.

-- =====================================================================
-- provider_applications - owner may write the row, but status must stay
-- 'pending'. The apply form (app/pro/apply) upserts status:'pending' both
-- on first submit and on resubmit-after-rejection, so legitimate use is
-- unaffected; only a hand-crafted status:'approved' write is rejected.
-- The hole exists on INSERT too (a user with no row could insert one
-- pre-approved), so both policies are tightened.
-- =====================================================================
drop policy if exists provider_apps_insert_own on public.provider_applications;
create policy provider_apps_insert_own on public.provider_applications
    for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists provider_apps_update_own on public.provider_applications;
create policy provider_apps_update_own on public.provider_applications
    for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id and status = 'pending');

-- =====================================================================
-- stores - the owner only ever updates profile fields (name, description,
-- contact, logo - see app/actions/stores.js updateStoreProfile). status /
-- is_active / rejection_reason / username are admin- or system-controlled.
-- A value-based WITH CHECK can't express "status must not change" (RLS
-- can't see the old row), so use column-level UPDATE grants instead: revoke
-- the blanket UPDATE and grant back only the editable columns. The
-- stores_update_own RLS policy still applies on top.
-- =====================================================================
revoke update on public.stores from anon, authenticated;
grant update (name, description, contact, logo) on public.stores to authenticated;
