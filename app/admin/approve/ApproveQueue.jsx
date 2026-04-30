'use client'
import { useState } from "react"
import toast from "react-hot-toast"
import StoreInfo from "@/components/admin/StoreInfo"
import { setStoreStatus } from "@/app/actions/admin"

const REJECT_PRESETS = [
    'Spam or bot signup',
    'Inappropriate shop name or content',
    'Selling a banned category',
    'Identity / contact info inconsistency',
    'Duplicate of another shop',
]

const ApproveQueue = ({ stores: initialStores }) => {

    const [stores, setStores] = useState(initialStores)
    const [pending, setPending] = useState({})       // { [storeId]: 'approved' | 'rejected' } while server action in flight
    const [rejectingId, setRejectingId] = useState(null)
    const [reason, setReason] = useState('')

    const startReject = (storeId) => {
        setRejectingId(storeId)
        setReason('')
    }

    const cancelReject = () => {
        setRejectingId(null)
        setReason('')
    }

    const submit = async (storeId, status, reasonText = '') => {
        setPending((p) => ({ ...p, [storeId]: status }))
        const result = await setStoreStatus(storeId, status, reasonText)
        if (result.error) {
            toast.error(result.error)
            setPending((p) => {
                const next = { ...p }
                delete next[storeId]
                return next
            })
            return
        }
        setStores((ss) => ss.filter(s => s.id !== storeId))
        setRejectingId(null)
        setReason('')
        toast.success(status === 'approved' ? 'Store approved.' : 'Store rejected.')
    }

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Approve <span className="text-slate-800 font-medium">Stores</span></h1>
            <p className="text-sm text-slate-500 mt-1">Stores waiting on review. Approving lets the seller&apos;s listings publish publicly.</p>

            {stores.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No applications pending</h1>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mt-6">
                    {stores.map((store) => {
                        const action = pending[store.id]
                        const isRejecting = rejectingId === store.id
                        return (
                            <div key={store.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl">
                                <StoreInfo store={{
                                    ...store,
                                    createdAt: store.created_at,
                                    user: store.user || { name: '—', email: '', image: '' },
                                }} />

                                <div className="flex flex-col gap-3 w-full md:w-auto md:max-w-sm">
                                    {!isRejecting ? (
                                        <div className="flex gap-3 flex-wrap">
                                            <button
                                                type="button"
                                                disabled={!!action}
                                                onClick={() => submit(store.id, 'approved')}
                                                className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-950 disabled:opacity-50 text-sm transition"
                                            >
                                                {action === 'approved' ? 'Approving…' : 'Approve'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!!action}
                                                onClick={() => startReject(store.id)}
                                                className="px-4 py-2 bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-slate-500 rounded disabled:opacity-50 text-sm transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 ring-1 ring-slate-200 rounded-lg p-3 space-y-3">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why are you rejecting this shop?</p>

                                            {/* Preset chips — click to fill the textarea */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {REJECT_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setReason(preset)}
                                                        className="text-[11px] bg-white ring-1 ring-slate-200 hover:ring-slate-400 rounded-full px-2.5 py-1 transition"
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={3}
                                                placeholder="Pick a preset above or type a specific reason. The seller sees this on their dashboard."
                                                className="w-full text-sm bg-white border border-slate-200 rounded p-2 outline-none focus:border-slate-400 transition"
                                            />

                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={cancelReject}
                                                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!reason.trim() || !!action}
                                                    onClick={() => submit(store.id, 'rejected', reason)}
                                                    className="px-3 py-1.5 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition"
                                                >
                                                    {action === 'rejected' ? 'Rejecting…' : 'Confirm reject'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default ApproveQueue
