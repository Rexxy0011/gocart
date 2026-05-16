-- Read-receipt writes for conversations.
--
-- 0017 added buyer_last_read_at / seller_last_read_at, and /messages/[id]
-- stamps the viewer's column on render. But 0008_rls.sql defines NO UPDATE
-- policy on `conversations` (only SELECT + INSERT) - so that write was
-- silently rejected by RLS and the navbar unread count never cleared.
--
-- Fix: a SECURITY DEFINER RPC (same pattern as bump_conversation_after_message
-- in 0017). It bypasses RLS but is tightly scoped - it only ever touches the
-- *caller's own* read timestamp, and only on a conversation they're a party
-- to. This is deliberately narrower than a blanket UPDATE policy, which
-- would also let a participant rewrite seller_id / last_sender_id / etc.

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        return;  -- signed-out caller - nothing to mark
    end if;

    -- The WHERE clause is the authorization gate (definer bypasses RLS):
    -- only a participant can match the row. The CASE ensures the buyer's
    -- call only moves buyer_last_read_at and the seller's only seller_*.
    update public.conversations
       set buyer_last_read_at  = case when buyer_id  = v_uid then now() else buyer_last_read_at  end,
           seller_last_read_at = case when seller_id = v_uid then now() else seller_last_read_at end
     where id = p_conversation_id
       and (buyer_id = v_uid or seller_id = v_uid);
end;
$$;

-- Callable only by signed-in users - not anon.
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
