-- Storage Row-Level Security for the two app buckets.
--
-- Path convention (set in lib/supabase/storage.js): every uploaded object
-- lives under "<userId>/<filename>" inside its bucket. The first folder
-- must equal auth.uid()::text — that's how we tie ownership.
--
-- product-images:
--   - public read so listing covers render for signed-out browsers
--   - owner-only write/update/delete
--
-- provider-docs:
--   - NO public read (sensitive ID scans + selfies)
--   - owner-only write/update/delete
--   - admin reads happen server-side via the service-role key, which
--     bypasses RLS and produces signed URLs (lib/supabase/admin.js)
--
-- This migration is idempotent — running it twice is safe.

-- ===== product-images ===================================================
drop policy if exists "gocart product-images public read"     on storage.objects;
drop policy if exists "gocart product-images owner insert"    on storage.objects;
drop policy if exists "gocart product-images owner update"    on storage.objects;
drop policy if exists "gocart product-images owner delete"    on storage.objects;

create policy "gocart product-images public read"
    on storage.objects for select
    using (bucket_id = 'product-images');

create policy "gocart product-images owner insert"
    on storage.objects for insert
    with check (
        bucket_id = 'product-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "gocart product-images owner update"
    on storage.objects for update
    using (
        bucket_id = 'product-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "gocart product-images owner delete"
    on storage.objects for delete
    using (
        bucket_id = 'product-images'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- ===== provider-docs ====================================================
-- No SELECT policy on purpose — anon + authenticated can't read directly.
-- Admin queue at /admin/providers fetches via service-role + signed URLs.
drop policy if exists "gocart provider-docs owner insert" on storage.objects;
drop policy if exists "gocart provider-docs owner update" on storage.objects;
drop policy if exists "gocart provider-docs owner delete" on storage.objects;

create policy "gocart provider-docs owner insert"
    on storage.objects for insert
    with check (
        bucket_id = 'provider-docs'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "gocart provider-docs owner update"
    on storage.objects for update
    using (
        bucket_id = 'provider-docs'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "gocart provider-docs owner delete"
    on storage.objects for delete
    using (
        bucket_id = 'provider-docs'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
