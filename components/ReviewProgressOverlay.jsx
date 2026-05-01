'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Clock, ShieldCheck, BadgeCheck, ScanSearch } from 'lucide-react'

// Shown briefly after a seller posts a listing. The DB trigger has already
// decided pending vs approved by the time we render — we just animate the
// pipeline so the seller feels the system actually did something. Mostly
// UX padding (~2.5s total) so a successful auto-approve doesn't feel like
// "wait, did anything happen?".
//
// Steps (visual only; the real work happened in the keyword pre-screen
// before insert + the auto_review_listing trigger on insert):
//   1. Content check — keyword scan
//   2. Account check — your post history
//   3. Risk assessment — category-weighted policy review
// Then a result panel with the actual outcome.
const STEPS = [
    { key: 'content', label: 'Content check',       Icon: ScanSearch },
    { key: 'account', label: 'Account history',     Icon: BadgeCheck },
    { key: 'risk',    label: 'Risk assessment',     Icon: ShieldCheck },
]
const STEP_MS = 700
const RESULT_LINGER_MS = 1600

const ReviewProgressOverlay = ({ status, onComplete }) => {

    // Index of the currently-running step. -1 = haven't started, length = done.
    const [stepIdx, setStepIdx] = useState(-1)

    // Sequentially advance through steps, then fire onComplete after a
    // brief linger on the result so the user can read it.
    useEffect(() => {
        let timers = []
        // Stagger each step
        STEPS.forEach((_, i) => {
            timers.push(setTimeout(() => setStepIdx(i), i * STEP_MS))
        })
        // Mark all done
        timers.push(setTimeout(() => setStepIdx(STEPS.length), STEPS.length * STEP_MS))
        // Fire callback
        timers.push(setTimeout(() => onComplete?.(), STEPS.length * STEP_MS + RESULT_LINGER_MS))
        return () => timers.forEach(clearTimeout)
    }, [onComplete])

    const allDone = stepIdx >= STEPS.length
    const progress = allDone ? 100 : Math.max(0, (stepIdx + 1) / (STEPS.length + 1) * 100)
    const isApproved = status === 'approved'

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

                <div className="flex items-center gap-3 mb-1">
                    <span className="inline-flex items-center justify-center size-10 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                        <ShieldCheck size={18} />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Reviewing your listing</h3>
                        <p className="text-xs text-slate-500">A quick check before it goes live.</p>
                    </div>
                </div>

                {/* Top progress bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-5">
                    <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step list */}
                <ul className="mt-5 space-y-3">
                    {STEPS.map((s, i) => {
                        const done = stepIdx > i || allDone
                        const active = stepIdx === i && !allDone
                        return (
                            <li key={s.key} className="flex items-center gap-3 text-sm">
                                <span className={`inline-flex items-center justify-center size-7 rounded-full ring-1 transition-colors ${
                                    done
                                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                                        : active
                                            ? 'bg-sky-50 text-sky-600 ring-sky-200'
                                            : 'bg-slate-50 text-slate-400 ring-slate-200'
                                }`}>
                                    {done
                                        ? <CheckCircle2 size={15} />
                                        : active
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : <s.Icon size={14} />}
                                </span>
                                <span className={done ? 'text-slate-700' : active ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                                    {s.label}
                                </span>
                            </li>
                        )
                    })}
                </ul>

                {/* Result panel — appears once steps complete */}
                {allDone && (
                    <div className={`mt-5 p-4 rounded-xl ring-1 transition-opacity duration-300 ${
                        isApproved
                            ? 'bg-emerald-50 ring-emerald-200'
                            : 'bg-amber-50 ring-amber-200'
                    }`}>
                        <div className="flex items-start gap-3">
                            <span className={`inline-flex items-center justify-center size-8 rounded-full shrink-0 ${
                                isApproved
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}>
                                {isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                            </span>
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${isApproved ? 'text-emerald-900' : 'text-amber-900'}`}>
                                    {isApproved ? 'Live now' : 'Pending review'}
                                </p>
                                <p className={`text-xs mt-0.5 leading-relaxed ${isApproved ? 'text-emerald-800/80' : 'text-amber-800/80'}`}>
                                    {isApproved
                                        ? 'Your listing is published and visible to buyers.'
                                        : 'New seller — your first listings get a quick admin look. We\'ll notify you when it\'s live (usually under a day).'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReviewProgressOverlay
