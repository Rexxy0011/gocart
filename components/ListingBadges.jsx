import { Crown, Flame, Boxes, Sparkles, Tag, BadgeCheck, Truck } from 'lucide-react'

const sizeCls = (size) => size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
const iconSize = (size) => size === 'sm' ? 9 : 11

// ─── Paid badges (Power Account) ───────────────────────────────────────────

export const FeaturedRibbon = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-sky-500 text-white font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
        <Crown size={iconSize(size)} /> Featured
    </span>
)

export const PowerSellerBadge = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
        <Sparkles size={iconSize(size)} /> Power Seller
    </span>
)

export const UrgentTag = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-yellow-300 text-yellow-950 font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
        <Flame size={iconSize(size)} /> Urgent
    </span>
)

export const BulkSaleTag = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-amber-300 text-amber-950 font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
        <Boxes size={iconSize(size)} /> Bulk sale
    </span>
)

// Single combined badge — picks the most informative of {urgent, bulkSale, both}
export const UrgentBulkTag = ({ urgent, bulkSale, size = 'md' }) => {
    if (urgent && bulkSale) {
        return (
            <span className={`inline-flex items-center gap-1 bg-gradient-to-br from-orange-400 to-rose-500 text-white font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
                <Flame size={iconSize(size)} /> Urgent bulk sale
            </span>
        )
    }
    if (bulkSale) return <BulkSaleTag size={size} />
    if (urgent)   return <UrgentTag size={size} />
    return null
}

// ─── Free / automatic tags (everyone gets these) ───────────────────────────

export const FreeTag = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-emerald-500 text-white font-bold uppercase tracking-wide rounded shadow-sm ${sizeCls(size)}`}>
        FREE
    </span>
)

export const ReducedTag = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 font-bold uppercase tracking-wide rounded ${sizeCls(size)}`}>
        <Tag size={iconSize(size)} /> Reduced
    </span>
)

export const DeliveryAvailableTag = ({ size = 'md' }) => (
    <span className={`inline-flex items-center gap-1 bg-slate-100 text-slate-700 ring-1 ring-slate-200 font-medium rounded-full ${sizeCls(size)}`}>
        <Truck size={iconSize(size)} /> Delivery
    </span>
)

const CONDITION_LABEL = {
    'new':    'New',
    'as-new': 'As good as new',
    'good':   'Good condition',
    'fair':   'Fair condition',
}

export const ConditionTag = ({ condition, size = 'md' }) => {
    const label = CONDITION_LABEL[condition]
    if (!label) return null
    return (
        <span className={`inline-flex items-center gap-1 bg-slate-100 text-slate-700 ring-1 ring-slate-200 font-medium rounded-full ${sizeCls(size)}`}>
            <BadgeCheck size={iconSize(size)} /> {label}
        </span>
    )
}

export const SellerTypeBadge = ({ type = 'private', size = 'md' }) => (
    <span className={`inline-flex items-center bg-white text-slate-600 ring-1 ring-slate-200 font-semibold uppercase tracking-wide rounded ${sizeCls(size)}`}>
        {type === 'trade' || type === 'business' ? 'Trade' : 'Private'}
    </span>
)
