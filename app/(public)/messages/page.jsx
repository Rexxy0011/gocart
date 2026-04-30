import { Inbox } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { fetchConversationsForUser } from "@/lib/supabase/conversations"
import ConversationList from "@/components/messages/ConversationList"

// Unified inbox — every conversation the user is part of, on either side.
export default async function MessagesInbox() {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { conversations, lastMessages } = await fetchConversationsForUser(supabase, user.id, 'all')

    return (
        <div className="mx-6">
            <div className="max-w-4xl mx-auto py-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center justify-center size-10 rounded-xl bg-sky-50 ring-1 ring-sky-200 text-sky-600">
                        <Inbox size={18} />
                    </span>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                        <p className="text-sm text-slate-500">Conversations you started or that buyers started with you.</p>
                    </div>
                </div>

                <ConversationList
                    conversations={conversations}
                    lastMessages={lastMessages}
                    currentUserId={user.id}
                    emptyTitle="No conversations yet"
                    emptyHint="Browse listings and click Send Message on anything that catches your eye, or wait for buyers to reach out about your listings."
                />
            </div>
        </div>
    )
}
