'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import OrderItem from "@/components/OrderItem";
import JobConfirmCard from "@/components/pro/JobConfirmCard";
import { getJobStatus } from "@/lib/features/jobs/jobsSlice";
import { ShieldCheck, Info } from "lucide-react";
import { orderDummyData } from "@/assets/assets";

const DEMO_BUYER_ID = 'buyer_demo'

export default function Orders() {

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        setOrders(orderDummyData)
    }, []);

    const allJobs = useSelector(state => state.jobs.list)
    const myJobs = useMemo(
        () => allJobs.filter(j => j.buyerId === DEMO_BUYER_ID),
        [allJobs]
    )
    const STATUS_RANK = { provider_confirmed: 0, awaiting_both: 1, buyer_confirmed: 2, verified: 3 }
    const sortedJobs = useMemo(() => {
        return [...myJobs].sort((a, b) => {
            const rank = STATUS_RANK[getJobStatus(a)] - STATUS_RANK[getJobStatus(b)]
            if (rank !== 0) return rank
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        })
    }, [myJobs])

    const actionNeededCount = myJobs.filter(j => {
        const s = getJobStatus(j)
        return s === 'provider_confirmed' || s === 'awaiting_both'
    }).length

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="my-20 max-w-7xl mx-auto space-y-16">

                {/* Bilateral confirmation — buyer perspective */}
                {sortedJobs.length > 0 && (
                    <section>
                        <div className='flex items-start gap-4 mb-4'>
                            <span className='inline-flex items-center justify-center size-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-600 shrink-0'>
                                <ShieldCheck size={20} />
                            </span>
                            <div>
                                <h2 className='text-2xl text-slate-900 font-semibold inline-flex items-center gap-2 flex-wrap'>
                                    Confirm completed jobs
                                    {actionNeededCount > 0 && (
                                        <span className='inline-flex items-center justify-center text-xs font-bold bg-rose-100 text-rose-700 ring-1 ring-rose-200 rounded-full px-2 py-0.5'>
                                            {actionNeededCount} need you
                                        </span>
                                    )}
                                </h2>
                                <p className='text-sm text-slate-600 mt-1'>
                                    Sellers you&apos;ve messaged about a job. Confirming once it&apos;s done unlocks your review and helps the seller earn milestone badges.
                                </p>
                            </div>
                        </div>

                        <div className='bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3 mb-5'>
                            <Info size={16} className='text-slate-500 mt-0.5 shrink-0' />
                            <p className='text-sm text-slate-600'>
                                <span className='font-semibold text-slate-900'>Why both sides?</span>{' '}
                                A job is only "verified" once both you and the seller agree it got done. This is what makes ratings on GoCart honest — no fake reviews from sellers paying for stars.
                            </p>
                        </div>

                        <div className='space-y-4'>
                            {sortedJobs.map(job => (
                                <JobConfirmCard key={job.id} job={job} perspective='buyer' />
                            ))}
                        </div>
                    </section>
                )}

                {/* Legacy "My Orders" — Tier-3 brand checkouts only (vast majority of buyers won't have any) */}
                {orders.length > 0 ? (
                    <section>
                        <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                        <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                            <thead>
                                <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                    <th className="text-left">Product</th>
                                    <th className="text-center">Total Price</th>
                                    <th className="text-left">Address</th>
                                    <th className="text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} />
                                ))}
                            </tbody>
                        </table>
                    </section>
                ) : sortedJobs.length === 0 ? (
                    <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
                        <h1 className="text-2xl sm:text-4xl font-semibold">Nothing here yet</h1>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
