import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Inbox, MessageSquareText } from 'lucide-react'

// Reusable list of conversations for /messages, /pro/inquiries, /store/inquiries.
// Empty-state customisable via `emptyTitle` + `emptyHint`.
const ConversationList = ({
    conversations = [],
    lastMessages = new Map(),
    currentUserId,
    emptyTitle = 'No conversations yet',
    emptyHint = 'Buyer messages will land here once someone reaches out.',
}) => {

    if (!conversations.length) {
        return (
            <div className='border border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/60'>
                <span className='inline-flex items-center justify-center size-14 rounded-full bg-white ring-1 ring-slate-200'>
                    <MessageSquareText size={22} className='text-slate-400' />
                </span>
                <h2 className='text-lg font-semibold text-slate-900 mt-5'>{emptyTitle}</h2>
                <p className='text-sm text-slate-600 mt-2 max-w-md mx-auto'>{emptyHint}</p>
            </div>
        )
    }

    return (
        <ul className='bg-white border border-slate-200 rounded-2xl overflow-hidden'>
            {conversations.map((c) => {
                const isBuyer = c.buyer_id === currentUserId
                const otherParty = isBuyer ? c.seller : c.buyer
                const otherName = otherParty?.name || (isBuyer ? 'Seller' : 'Buyer')
                const initial = otherName.charAt(0).toUpperCase()
                const last = lastMessages.get(c.id)
                const lastBy = last?.sender_id === currentUserId ? 'You' : otherName.split(' ')[0]
                const listingImg = c.listing?.images?.[0]
                return (
                    <li key={c.id} className='border-b border-slate-100 last:border-b-0'>
                        <Link href={`/messages/${c.id}`} className='flex items-center gap-4 p-4 hover:bg-slate-50 transition'>
                            {otherParty?.image ? (
                                <Image src={otherParty.image} alt={otherName} width={48} height={48} className='size-12 rounded-full object-cover ring-1 ring-slate-200 shrink-0' />
                            ) : (
                                <div className='size-12 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-slate-600 font-semibold shrink-0'>
                                    {initial}
                                </div>
                            )}

                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between gap-3'>
                                    <p className='text-sm font-semibold text-slate-900 truncate'>
                                        {otherName}
                                        <span className='font-normal text-slate-500 text-xs ml-1.5'>· {isBuyer ? 'seller' : 'buyer'}</span>
                                    </p>
                                    <p className='text-[11px] text-slate-400 shrink-0'>
                                        {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className='text-xs text-slate-500 mt-0.5 line-clamp-1'>
                                    Re: <span className='text-slate-700 font-medium'>{c.listing?.name}</span>
                                </p>
                                {last && (
                                    <p className='text-sm text-slate-600 mt-1.5 line-clamp-1'>
                                        <span className='text-slate-400'>{lastBy}:</span> {last.body}
                                    </p>
                                )}
                            </div>

                            {listingImg && (
                                <div className='size-14 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0 hidden sm:block'>
                                    <Image src={listingImg} alt='' width={56} height={56} className='size-full object-cover' />
                                </div>
                            )}
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

export default ConversationList
