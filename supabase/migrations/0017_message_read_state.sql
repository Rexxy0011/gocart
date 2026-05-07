-- Per-side read receipts on conversations + last sender denormalised onto
-- the conversation row. Together they let the navbar compute "unread for
-- the current viewer" with a single count query, no per-conversation
-- fetch of the latest message.
--
-- Rule: a conversation counts as unread for viewer V when
--   last_sender_id <> V       (V isn't the one who sent the latest msg)
--   AND last_message_at >
--       coalesce(<viewer's last_read>, '-infinity'::timestamptz)
--
-- /messages/[id] stamps the appropriate column on render so opening a
-- thread immediately clears it from the navbar count.

alter table public.conversations
    add column if not exists buyer_last_read_at  timestamptz,
    add column if not exists seller_last_read_at timestamptz,
    add column if not exists last_sender_id      uuid references public.profiles(id) on delete set null;

-- Backfill last_sender_id from the latest message per conversation so
-- existing threads aren't all marked unread on first deploy.
update public.conversations c
   set last_sender_id = m.sender_id
  from (
        select distinct on (conversation_id) conversation_id, sender_id
          from public.messages
         order by conversation_id, created_at desc
       ) m
 where m.conversation_id = c.id
   and c.last_sender_id is null;

-- Bump trigger now also sets last_sender_id. Old version only touched
-- last_message_at; replacing it keeps both fields in lockstep on insert.
create or replace function public.bump_conversation_after_message()
returns trigger
security definer
set search_path = public
as $$
begin
    update public.conversations
        set last_message_at = new.created_at,
            last_sender_id  = new.sender_id
        where id = new.conversation_id;
    return new;
end;
$$ language plpgsql;
