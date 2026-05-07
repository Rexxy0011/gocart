-- Adapt the ratings table for the classifieds model. The original
-- schema (migration 0001) was designed for a custodial e-commerce flow
-- where every review was tied to a confirmed order:
--
--   ratings(user_id, product_id, order_id NOT NULL, review NOT NULL, ...)
--
-- GoCart doesn't have orders — buyers and sellers transact off-platform
-- after messaging. We still want reviews (provider reputation is the
-- moat), but they have to work without an order id and without forcing
-- a written comment.
--
-- Changes:
--   1. order_id → nullable (drop the NOT NULL; existing rows keep their
--      values, future buyer-leaves-review-after-deal flow can still
--      stamp it once that primitive exists).
--   2. review (text) → nullable. Some users only leave stars.
--   3. New uniqueness: one rating per (user, product). The old constraint
--      let a user re-rate the same product if attached to a different
--      order — now collapsed to one rating per user per listing. Re-rate
--      = update the existing row.

alter table public.ratings
    alter column order_id drop not null;

alter table public.ratings
    alter column review drop not null;

-- Drop the old (user_id, product_id, order_id) constraint and replace
-- with (user_id, product_id). Idempotent: tolerates a partial run.
do $$
begin
    if exists (
        select 1 from pg_constraint
        where conname = 'ratings_user_id_product_id_order_id_key'
          and conrelid = 'public.ratings'::regclass
    ) then
        alter table public.ratings
            drop constraint ratings_user_id_product_id_order_id_key;
    end if;
end $$;

alter table public.ratings
    drop constraint if exists ratings_user_product_unique;

alter table public.ratings
    add constraint ratings_user_product_unique unique (user_id, product_id);

create index if not exists ratings_product_idx on public.ratings(product_id);
