-- Messaging foundation: one conversation per (listing × buyer) pair, with
-- a stream of messages underneath. Sellers see all conversations on their
-- listings; buyers see one conversation per listing they've reached out on.
--
-- Realtime: the messages table needs to be added to the supabase_realtime
-- publication (last block) so /messages/[id] can subscribe to inserts.

-- 1. conversations ---------------------------------------------------------

create table if not exists public.conversations (
    id              uuid primary key default gen_random_uuid(),
    listing_id      uuid not null references public.products(id) on delete cascade,
    buyer_id        uuid not null references public.profiles(id) on delete cascade,
    seller_id       uuid not null references public.profiles(id) on delete cascade,
    last_message_at timestamptz not null default now(),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    -- One conversation per listing × buyer pair. A buyer can re-open the
    -- same thread by messaging the same listing again.
    constraint conversations_listing_buyer_unique unique (listing_id, buyer_id),
    -- No self-conversations.
    constraint conversations_distinct_parties check (buyer_id <> seller_id)
);

create index if not exists conversations_buyer_idx
    on public.conversations(buyer_id, last_message_at desc);
create index if not exists conversations_seller_idx
    on public.conversations(seller_id, last_message_at desc);

drop trigger if exists conversations_touch on public.conversations;
create trigger conversations_touch
    before update on public.conversations
    for each row execute procedure public.touch_updated_at();

-- 2. messages --------------------------------------------------------------

create table if not exists public.messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id       uuid not null references public.profiles(id) on delete cascade,
    body            text not null check (length(trim(body)) > 0),
    created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx
    on public.messages(conversation_id, created_at);

-- 3. Bump conversation.last_message_at on every message insert ------------
-- Keeps the inbox sort correct without an extra application-side update.

create or replace function public.bump_conversation_after_message()
returns trigger
security definer
set search_path = public
as $$
begin
    update public.conversations
        set last_message_at = new.created_at
        where id = new.conversation_id;
    return new;
end;
$$ language plpgsql;

drop trigger if exists bump_conversation_after_message on public.messages;
create trigger bump_conversation_after_message
    after insert on public.messages
    for each row execute procedure public.bump_conversation_after_message();

-- 4. Enable Realtime on messages -----------------------------------------
-- Adding to the supabase_realtime publication lets browser subscriptions
-- via supabase.channel(...).on('postgres_changes', ...) receive INSERTs.

alter publication supabase_realtime add table public.messages;
