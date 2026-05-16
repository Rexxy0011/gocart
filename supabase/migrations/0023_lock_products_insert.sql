-- Lock down listing creation.
--
-- 0008_rls.sql's products INSERT policy only checks store ownership - it
-- never constrained which columns a seller may set. So an authenticated
-- user could POST a products row straight to PostgREST (bypassing the
-- add-product UI) with review_status:'approved' - skipping admin review -
-- or featured_until / bumped_until set in the future, faking a paid boost
-- for free.
--
-- Fix: revoke INSERT on products from the authenticated/anon roles. The
-- only remaining insert path is the createListing server action
-- (app/actions/listings.js), which runs service-role, verifies store
-- ownership, and whitelists the seller-settable columns.
--
-- SELECT and UPDATE are untouched - buyers still browse, and sellers still
-- edit / soft-remove their own listings under the existing RLS policies.

revoke insert on public.products from anon, authenticated;
