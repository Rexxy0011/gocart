-- Boost expiry sweeper. Boost columns (featured / urgent / bulk_sale /
-- bumped_at) are set to true + *_until timestamp on payment. Nothing
-- expires them automatically — without this job they'd stay "boosted"
-- forever once paid for.
--
-- Strategy: pg_cron job runs every 10 min and flips expired flags off,
-- nulls the matching *_until. All buyer-side queries continue to filter
-- on the booleans (.eq('featured', true), etc.) so no app code change.
--
-- pg_cron is pre-installed on Supabase but the extension must be enabled
-- once per project. The first statement is idempotent.

create extension if not exists pg_cron;

-- Sweeper function. Single transaction, four UPDATEs — small batches
-- because indexes on *_until are partial (where ... is not null) so the
-- planner uses them tightly.
create or replace function public.expire_boosts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.products
        set featured = false, featured_until = null
        where featured = true and featured_until is not null and featured_until <= now();

    update public.products
        set urgent = false, urgent_until = null
        where urgent = true and urgent_until is not null and urgent_until <= now();

    update public.products
        set bulk_sale = false, bulk_sale_until = null
        where bulk_sale = true and bulk_sale_until is not null and bulk_sale_until <= now();

    -- bumped_at is the sort key, not a boolean. Null it out so expired
    -- bumps stop pinning the listing to the top of recency-sorted feeds.
    update public.products
        set bumped_at = null, bumped_until = null
        where bumped_at is not null and bumped_until is not null and bumped_until <= now();
end;
$$;

-- Schedule. Re-running this migration replaces the schedule rather than
-- duplicating — unschedule first if it exists, then schedule fresh.
-- '*/10 * * * *' = every 10 minutes.
do $$
begin
    if exists (select 1 from cron.job where jobname = 'expire_boosts') then
        perform cron.unschedule('expire_boosts');
    end if;
end $$;

select cron.schedule(
    'expire_boosts',
    '*/10 * * * *',
    $$select public.expire_boosts();$$
);
