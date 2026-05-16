-- KYC data minimisation. Two changes:
--
-- 1. consent_given_at - explicit timestamp of when the applicant ticked
--    the "I consent to processing this ID" checkbox on /pro/apply. NDPA
--    requires explicit consent at collection time; this gives us a
--    legal record we can produce if a regulator ever asks.
--
-- 2. purge_old_kyc() + pg_cron job - auto-deletes the ID document + selfie
--    from the provider-docs Storage bucket 30 days after approval/rejection.
--    The application row itself stays (we still need the "verified" fact),
--    but the sensitive raw documents stop existing in our infra. NDPA
--    "storage limitation" - keep no longer than necessary.
--
-- Together these shrink the window during which we hold government IDs
-- from "forever" to "max 30 days post-decision". That's the difference
-- between a small breach and a regulator-investigation breach.

-- 1. Consent record -------------------------------------------------------
alter table public.provider_applications
    add column if not exists consent_given_at timestamptz;

-- 2. Purge function -------------------------------------------------------
-- Deletes Storage objects by removing rows from storage.objects (Supabase
-- triggers handle the actual file deletion). Then nulls the URL columns
-- so nothing in our app still points at deleted files.
create or replace function public.purge_old_kyc()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
    cutoff timestamptz := now() - interval '30 days';
begin
    -- Drop the underlying files. We only target paths still referenced
    -- by approved/rejected apps past the cutoff so a re-applied user's
    -- fresh upload isn't accidentally hit.
    delete from storage.objects
        where bucket_id = 'provider-docs'
          and name in (
              select id_document_url
                from public.provider_applications
               where status in ('approved', 'rejected')
                 and updated_at <= cutoff
                 and id_document_url is not null
              union
              select selfie_url
                from public.provider_applications
               where status in ('approved', 'rejected')
                 and updated_at <= cutoff
                 and selfie_url is not null
          );

    -- Null out the references so the admin queue doesn't try to mint
    -- signed URLs for files that no longer exist.
    update public.provider_applications
        set id_document_url = null,
            selfie_url = null
        where status in ('approved', 'rejected')
          and updated_at <= cutoff
          and (id_document_url is not null or selfie_url is not null);
end;
$$;

-- 3. Schedule -------------------------------------------------------------
-- Daily at 03:00 UTC (04:00 Lagos) - quiet hour, no contention with the
-- 09:00 boost-reminder cron or the 10-min boost-expiry sweeper.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'purge_old_kyc') then
        perform cron.unschedule('purge_old_kyc');
    end if;
end $$;

select cron.schedule(
    'purge_old_kyc',
    '0 3 * * *',
    $$select public.purge_old_kyc();$$
);
