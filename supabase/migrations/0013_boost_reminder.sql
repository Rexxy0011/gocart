-- Tracks whether the T-24h "your boost expires tomorrow" email has been
-- sent for a given paid boost order. Single column, nullable; null = not
-- yet sent, timestamp = sent at this moment. The daily Vercel cron job
-- finds rows where this is null AND the boost expires in ~24h, mails the
-- seller, and stamps it.

alter table public.boost_orders
    add column if not exists reminder_sent_at timestamptz;

-- Speeds up the cron sweep — most rows have already been reminded or are
-- pending/failed, so a partial index on the small "actionable" set is cheap.
create index if not exists boost_orders_reminder_idx
    on public.boost_orders(paid_at)
    where status = 'paid' and reminder_sent_at is null;
