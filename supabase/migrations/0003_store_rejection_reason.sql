-- Lets the admin record WHY a shop was rejected, so the seller's dashboard
-- can show a useful message instead of a generic "rejected" banner.
--
-- Nullable: only populated when status flips to 'rejected'. We don't clear
-- it on subsequent re-approval — keeps an audit trail of past decisions.

alter table public.stores
    add column if not exists rejection_reason text;
