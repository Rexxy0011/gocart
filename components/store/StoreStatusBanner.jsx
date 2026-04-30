import { Hourglass, ShieldAlert } from 'lucide-react'

// Sits at the top of every /store/* page when the seller's shop is still
// awaiting (or has been refused) admin review. Listings can be created either
// way; only their public visibility waits on approval.
const StoreStatusBanner = ({ status, reason }) => {
    if (status === 'pending') {
        return (
            <div className='mb-6 max-w-5xl bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4 flex items-start gap-3'>
                <Hourglass size={16} className='text-amber-600 mt-0.5 shrink-0' />
                <div className='flex-1'>
                    <p className='text-sm font-semibold text-amber-900'>Shop pending review</p>
                    <p className='text-sm text-amber-800 mt-0.5'>
                        You can post listings now, but they won&apos;t appear publicly until an admin reviews your shop. Reviews usually take less than 24 hours.
                    </p>
                </div>
            </div>
        )
    }
    if (status === 'rejected') {
        return (
            <div className='mb-6 max-w-5xl bg-rose-50 ring-1 ring-rose-200 rounded-xl p-4 flex items-start gap-3'>
                <ShieldAlert size={16} className='text-rose-600 mt-0.5 shrink-0' />
                <div className='flex-1'>
                    <p className='text-sm font-semibold text-rose-900'>Shop rejected</p>
                    {reason ? (
                        <>
                            <p className='text-sm text-rose-800 mt-0.5'>
                                <span className='font-medium'>Reason:</span> {reason}
                            </p>
                            <p className='text-xs text-rose-700 mt-2'>
                                Fix the issue and reach out to support to re-submit.
                            </p>
                        </>
                    ) : (
                        <p className='text-sm text-rose-800 mt-0.5'>
                            Your shop didn&apos;t pass review. Reach out to support.
                        </p>
                    )}
                </div>
            </div>
        )
    }
    return null
}

export default StoreStatusBanner
