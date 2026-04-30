import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchConversationsForUser } from '@/lib/supabase/conversations'
import ConversationList from '@/components/messages/ConversationList'

// Provider-side inquiries — only conversations on the user's service
// listings. Clicking a row drops them on /messages/[id], the same shared
// thread view as the unified /messages inbox.
export default async function ProInquiries() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { conversations, lastMessages } = await fetchConversationsForUser(
        supabase, user.id, 'selling-services'
    )

    return (
        <div className='text-slate-700 mb-28 max-w-4xl'>
            <div className='flex items-center gap-3 mb-6'>
                <span className='inline-flex items-center justify-center size-10 rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-600'>
                    <Inbox size={18} />
                </span>
                <div>
                    <h1 className='text-2xl text-slate-900 font-semibold'>Inquiries</h1>
                    <p className='text-sm text-slate-500'>Buyer messages on your service listings. Reply directly — GoCart never takes a cut on offline jobs.</p>
                </div>
            </div>

            <ConversationList
                conversations={conversations}
                lastMessages={lastMessages}
                currentUserId={user.id}
                emptyTitle='No inquiries yet'
                emptyHint='When a buyer messages you about one of your service listings, the conversation lands here.'
            />
        </div>
    )
}
