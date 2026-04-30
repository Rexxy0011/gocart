'use client'
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { format, isToday, isYesterday } from "date-fns"
import { Send } from "lucide-react"
import { toast } from "react-hot-toast"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "@/app/actions/messages"

const formatTimestamp = (raw) => {
    const d = new Date(raw)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
    return format(d, 'd MMM HH:mm')
}

const MessageThread = ({ conversationId, currentUserId, otherParty, initialMessages }) => {

    const supabase = createClient()
    const [messages, setMessages] = useState(initialMessages)
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const scrollerRef = useRef(null)

    // Auto-scroll to bottom whenever messages change.
    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight })
    }, [messages.length])

    // Realtime subscription — append every new INSERT into this conversation.
    useEffect(() => {
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            }, (payload) => {
                setMessages((prev) => {
                    // Avoid double-inserts: server action already returned this
                    // message and we appended it optimistically. The realtime
                    // event for our own insert would otherwise duplicate.
                    if (prev.some(m => m.id === payload.new.id)) return prev
                    return [...prev, payload.new]
                })
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [conversationId, supabase])

    const onSubmit = async (e) => {
        e.preventDefault()
        const body = draft.trim()
        if (!body || sending) return
        setSending(true)
        const result = await sendMessage({ conversationId, body })
        if (result.error) {
            toast.error(result.error)
            setSending(false)
            return
        }
        // Optimistic local append. Realtime echo is de-duped via id check.
        setMessages((prev) => [...prev, result.message])
        setDraft('')
        setSending(false)
    }

    const initial = (otherParty.name || '?').charAt(0).toUpperCase()

    return (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[70vh] min-h-[480px] overflow-hidden">

            {/* Other-party header */}
            <div className="border-b border-slate-100 p-4 flex items-center gap-3">
                {otherParty.image ? (
                    <Image src={otherParty.image} alt={otherParty.name} width={40} height={40} className="size-10 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                    <div className="size-10 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                        {initial}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{otherParty.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{otherParty.role}</p>
                </div>
            </div>

            {/* Messages scroller */}
            <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center mt-8">No messages yet — say hi.</p>
                ) : messages.map((m) => {
                    const mine = m.sender_id === currentUserId
                    return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                                <div className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                                    mine
                                        ? 'bg-slate-900 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-900 rounded-bl-md'
                                }`}>
                                    {m.body}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 px-1">{formatTimestamp(m.created_at)}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Compose */}
            <form onSubmit={onSubmit} className="border-t border-slate-100 p-3 flex items-end gap-2">
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        // Enter sends, Shift+Enter inserts a newline.
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            onSubmit(e)
                        }
                    }}
                    rows={1}
                    placeholder="Write a message…"
                    className="flex-1 resize-none text-sm px-3 py-2 bg-slate-50 ring-1 ring-slate-200 rounded-xl outline-none focus:ring-slate-400 transition max-h-32"
                />
                <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    aria-label="Send"
                    className="shrink-0 size-10 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center justify-center transition"
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    )
}

export default MessageThread
