'use client'
import { assets, categoryGroups, serviceSpecialties, stateAreas } from "@/assets/assets"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { BadgeCheck, Boxes, Car, Flame, Info, MapPin, Phone, Rocket, Star, TrendingUp, X, Zap } from "lucide-react"
import Dropdown from "@/components/Dropdown"

const BOOSTS = [
    {
        key: 'featured',
        title: 'Featured ribbon',
        price: 3000,
        duration: '7 days',
        why: 'Locks your listing at the top of its category and location, above every standard listing. Highest visibility per naira.',
        Icon: Star,
        tagClass: 'bg-sky-500 text-white',
    },
    {
        key: 'urgent',
        title: 'Urgent tag',
        price: 2000,
        duration: '7 days',
        why: 'Yellow "Urgent" badge pulls attention. Right for time-sensitive sales — relocating, need it gone, price is firm.',
        Icon: Flame,
        tagClass: 'bg-yellow-300 text-yellow-950',
    },
    {
        key: 'bulkSale',
        title: 'Bulk sale',
        price: 4000,
        duration: '14 days',
        why: 'Unlocks the multi-item listing format. List a flat, garage, or estate sale as one ad. Right for relocators and clear-outs.',
        Icon: Boxes,
        tagClass: 'bg-amber-300 text-amber-950',
    },
    {
        key: 'bumpUp',
        title: 'Bump up',
        price: 1500,
        duration: '7 days',
        why: 'Auto-bumps your listing to the top of the feed once every day. Buyers re-discover it without you lifting a finger.',
        Icon: TrendingUp,
        tagClass: 'bg-emerald-500 text-white',
    },
]

const BUNDLE = {
    price: 5500,
    duration: '14 days',
    label: 'Boost bundle',
    why: 'Featured + Urgent + 3 daily Bumps. Saves ~17% vs buying separately. The "must sell, can\'t fail" option.',
    keys: ['featured', 'urgent', 'bumpUp'],
}

const SERVICES_GROUP_NAME = 'Repairs & Services'
const VEHICLES_GROUP_NAME = 'Vehicles'
const serviceSet = new Set(categoryGroups.find(g => g.name === SERVICES_GROUP_NAME)?.items || [])
const vehicleSet = new Set(categoryGroups.find(g => g.name === VEHICLES_GROUP_NAME)?.items || [])

const CONDITIONS = [
    { value: 'new',    label: 'New' },
    { value: 'as-new', label: 'As good as new' },
    { value: 'good',   label: 'Good condition' },
    { value: 'fair',   label: 'Fair condition' },
]

const URGENCY_REASONS = [
    { value: 'leaving-country', label: 'Leaving the country' },
    { value: 'closing-down',    label: 'Closing down / business winding up' },
    { value: 'didnt-fit',       label: "Didn't fit my purpose" },
    { value: 'upgrading',       label: 'Upgrading to newer version' },
    { value: 'gift-not-needed', label: 'Gift, not needed' },
    { value: 'other',           label: 'Other reason' },
]

const PRICE_UNITS = [
    { value: 'job',   label: 'per job' },
    { value: 'hour',  label: 'per hour' },
    { value: 'quote', label: 'quote on request' },
]

const LOCATIONS = Object.keys(stateAreas).map(c => ({ value: c, label: c }))

export default function StoreAddProduct() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [portfolioImages, setPortfolioImages] = useState([])
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        price: "",
        wasPrice: "",
        free: false,
        priceMin: "",
        priceMax: "",
        priceUnit: "job",
        category: "",
        condition: "",
        deliveryAvailable: false,
        urgent: false,
        urgencyReason: "",
        bulkSale: false,
        featured: false,
        bumpUp: false,
        specialties: [],
        responseTime: "",
        areaCovered: "",
        location: "",
        phone: "",
    })
    const [loading, setLoading] = useState(false)

    const isService = useMemo(() => serviceSet.has(productInfo.category), [productInfo.category])
    const isVehicle = useMemo(() => vehicleSet.has(productInfo.category), [productInfo.category])
    const availableSpecialties = serviceSpecialties[productInfo.category] || []

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const toggleSpecialty = (s) => {
        setProductInfo((p) => ({
            ...p,
            specialties: p.specialties.includes(s)
                ? p.specialties.filter(x => x !== s)
                : [...p.specialties, s],
        }))
    }

    const onCategoryChange = (e) => {
        setProductInfo({ ...productInfo, category: e.target.value, specialties: [] })
    }

    const addPortfolioFiles = (files) => {
        const remaining = 6 - portfolioImages.length
        setPortfolioImages([...portfolioImages, ...Array.from(files).slice(0, remaining)])
    }

    const removePortfolioImage = (idx) => {
        setPortfolioImages(portfolioImages.filter((_, i) => i !== idx))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Logic to add a listing
    }

    const headerTitle = isService ? 'Offer your service' : 'Post an ad'
    const submitLabel = isService ? 'Publish service' : 'Post ad'

    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Posting…" })} className="text-slate-500 mb-28 max-w-2xl">

            {/* Header */}
            <h1 className="text-2xl text-slate-900 font-semibold">{headerTitle}</h1>

            {/* How it works — sets the classifieds expectation */}
            <div className="mt-4 mb-7 bg-slate-50 ring-1 ring-slate-200 rounded-lg p-4 flex items-start gap-3">
                <Info size={16} className="text-slate-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">How it works:</span>{' '}
                    Buyers contact you directly through GoCart messaging. We don&apos;t take any cut on offline sales — listing is free and stays free.
                </p>
            </div>

            {/* Category — first, because it drives everything else */}
            <label className="flex flex-col gap-2 my-6">
                <span className="text-slate-700 font-medium">Category</span>
                <select onChange={onCategoryChange} value={productInfo.category} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required>
                    <option value="">Select a category</option>
                    {categoryGroups.map((group) => (
                        <optgroup key={group.name} label={group.name}>
                            {group.items.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {isService && (
                    <span className="text-xs text-emerald-700">This is a service listing — provider-specific fields appear below.</span>
                )}
            </label>

            {/* Vehicle perk — Free VIN check */}
            {isVehicle && (
                <div className="mb-6 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 flex items-start gap-3 max-w-xl">
                    <span className="inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0">
                        <Car size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-900">Free VIN check available</p>
                        <p className="text-xs text-emerald-900/80 mt-0.5">
                            Add your car&apos;s VIN and we&apos;ll attach a free history report (mileage, accidents, ownership) to your ad — buyers trust faster.
                        </p>
                        <button type="button" className="mt-2 text-xs font-semibold text-emerald-800 hover:underline">
                            Run free VIN check →
                        </button>
                    </div>
                </div>
            )}

            {/* Specialties (services only) */}
            {isService && availableSpecialties.length > 0 && (
                <div className="my-6">
                    <span className="text-slate-700 font-medium">Specialties (pick all that apply)</span>
                    <div className="flex flex-wrap gap-2 mt-2 max-w-xl">
                        {availableSpecialties.map((s) => {
                            const active = productInfo.specialties.includes(s)
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSpecialty(s)}
                                    className={`text-sm px-3 py-1.5 rounded-full ring-1 transition ${
                                        active
                                            ? 'bg-slate-900 text-white ring-slate-900'
                                            : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-400'
                                    }`}
                                >
                                    {s}
                                </button>
                            )
                        })}
                    </div>
                    {productInfo.specialties.length === 0 && (
                        <p className="text-xs text-slate-400 mt-2">Pick at least one so buyers can find you.</p>
                    )}
                </div>
            )}

            {/* Photos */}
            <div className="my-6">
                <p className="text-slate-700 font-medium">Photos</p>
                <p className="text-xs text-slate-500 mt-0.5">Add up to 4 — first photo is the cover. Clear photos = more replies.</p>
                <div className="flex gap-3 mt-3">
                    {Object.keys(images).map((key) => (
                        <label key={key} htmlFor={`images${key}`}>
                            <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                            <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                        </label>
                    ))}
                </div>
            </div>

            {/* Title */}
            <label className="flex flex-col gap-2 my-6">
                <span className="text-slate-700 font-medium">{isService ? 'Service title' : 'Ad title'}</span>
                <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={productInfo.name}
                    placeholder={isService ? 'e.g. AC repair & gas refill — same-day callouts' : 'e.g. iPhone 13 Pro 256GB, Pacific Blue — like new'}
                    className="w-full max-w-xl p-2 px-4 outline-none border border-slate-200 rounded"
                    required
                />
                <span className="text-xs text-slate-400">Short and specific — what it is, key feature, condition.</span>
            </label>

            {/* Description */}
            <label className="flex flex-col gap-2 my-6">
                <span className="text-slate-700 font-medium">{isService ? 'About this service' : 'Description'}</span>
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    placeholder={isService
                        ? 'What you do, your process, what buyers can expect, your typical response time.'
                        : 'Condition details, what\'s included, why you\'re selling, collection or delivery preferences.'}
                    rows={5}
                    className="w-full max-w-xl p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                    required
                />
            </label>

            {/* PRODUCT-ONLY: Condition + Delivery */}
            {!isService && (
                <div className="grid sm:grid-cols-2 gap-4 my-6 max-w-xl">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Condition</span>
                        <Dropdown
                            value={productInfo.condition}
                            onChange={(v) => setProductInfo({ ...productInfo, condition: v })}
                            placeholder="Select condition"
                            leftIcon={<BadgeCheck size={15} className="text-slate-400 shrink-0" />}
                            options={CONDITIONS}
                        />
                    </div>
                    <label className="flex items-center gap-2 mt-7">
                        <input
                            type="checkbox"
                            checked={productInfo.deliveryAvailable}
                            onChange={(e) => setProductInfo({ ...productInfo, deliveryAvailable: e.target.checked })}
                            className="size-4"
                        />
                        <span className="text-sm text-slate-700">I can deliver / drop off</span>
                    </label>
                </div>
            )}

            {/* PRICE — products */}
            {!isService && (
                <>
                    <label className="flex items-center gap-3 my-6 cursor-pointer max-w-xl">
                        <input
                            type="checkbox"
                            checked={productInfo.free}
                            onChange={(e) => setProductInfo({
                                ...productInfo,
                                free: e.target.checked,
                                ...(e.target.checked ? { price: "", wasPrice: "", urgent: false, bulkSale: false, urgencyReason: '' } : {}),
                            })}
                            className="size-4"
                        />
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5">FREE</span>
                        <span className="text-sm text-slate-700">List as a free giveaway</span>
                    </label>

                    {productInfo.free ? (
                        <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-lg p-3 max-w-xl mb-6 text-sm text-emerald-900">
                            Listed as <span className="font-semibold">Free</span> — buyers see a green FREE tag. Pricing and Sell-quicker boosts don&apos;t apply to giveaways.
                        </div>
                    ) : (
                        <div className="my-6 max-w-xl">
                            <div className="flex flex-wrap gap-5 items-end">
                                <label className="flex flex-col gap-2">
                                    <span className="text-slate-700 font-medium">Asking price ({currency})</span>
                                    <input
                                        type="number"
                                        name="price"
                                        onChange={onChangeHandler}
                                        value={productInfo.price}
                                        placeholder="0"
                                        className="w-44 p-2 px-4 outline-none border border-slate-200 rounded"
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className="text-slate-500 text-sm">Was ({currency}) <span className="text-slate-400">— optional</span></span>
                                    <input
                                        type="number"
                                        name="wasPrice"
                                        onChange={onChangeHandler}
                                        value={productInfo.wasPrice}
                                        placeholder="0"
                                        className="w-44 p-2 px-4 outline-none border border-slate-200 rounded"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                If you fill in <span className="font-medium">Was</span>, the old price shows struck through next to the asking price.
                            </p>
                        </div>
                    )}

                    {/* Boosts — optional paid add-ons, hidden when free */}
                    {!productInfo.free && (() => {
                        const selectedKeys = BOOSTS.filter(b => productInfo[b.key]).map(b => b.key)
                        const allBundleSelected = BUNDLE.keys.every(k => selectedKeys.includes(k))
                        const subtotal = allBundleSelected
                            ? BUNDLE.price + BOOSTS.filter(b => !BUNDLE.keys.includes(b.key) && productInfo[b.key]).reduce((s, b) => s + b.price, 0)
                            : BOOSTS.filter(b => productInfo[b.key]).reduce((s, b) => s + b.price, 0)

                        return (
                            <section className="my-8 max-w-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Rocket size={14} className="text-sky-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">Boost this listing</h3>
                                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 ml-1">Optional</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">
                                    Pick any combination — pay once, runs for the duration shown. Skip and your listing is still free and live.
                                </p>

                                <div className="rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100 bg-white">
                                    {BOOSTS.map((boost) => {
                                        const checked = productInfo[boost.key]
                                        return (
                                            <div key={boost.key} className="p-4">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const isChecking = e.target.checked
                                                            setProductInfo((p) => ({
                                                                ...p,
                                                                [boost.key]: isChecking,
                                                                ...(boost.key === 'urgent' && {
                                                                    urgencyReason: isChecking ? p.urgencyReason || 'other' : '',
                                                                }),
                                                            }))
                                                        }}
                                                        className="size-4 mt-0.5 shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5 ${boost.tagClass}`}>
                                                                <boost.Icon size={11} /> {boost.title}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-900">₦{boost.price.toLocaleString()}</span>
                                                            <span className="text-xs text-slate-500">· {boost.duration}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{boost.why}</p>
                                                    </div>
                                                </label>

                                                {boost.key === 'urgent' && checked && (
                                                    <div className="ml-7 mt-3 max-w-sm">
                                                        <p className="text-xs text-slate-500 mb-1.5">
                                                            Why is this urgent? <span className="text-slate-400">(private — buyers see only the Urgent tag)</span>
                                                        </p>
                                                        <Dropdown
                                                            value={productInfo.urgencyReason}
                                                            onChange={(v) => setProductInfo({ ...productInfo, urgencyReason: v })}
                                                            placeholder="Pick a reason"
                                                            options={URGENCY_REASONS}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Bundle suggestion when bundle-eligible boosts are selected */}
                                {allBundleSelected && (
                                    <div className="mt-3 bg-sky-50 ring-1 ring-sky-200 rounded-xl p-4 flex items-start gap-3">
                                        <Zap size={16} className="text-sky-600 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {BUNDLE.label} — ₦{BUNDLE.price.toLocaleString()} · {BUNDLE.duration}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">{BUNDLE.why}</p>
                                            <p className="text-xs text-sky-700 font-medium mt-1.5">
                                                Bundled cost ₦{BUNDLE.price.toLocaleString()} vs ₦{BUNDLE.keys.reduce((s, k) => s + BOOSTS.find(b => b.key === k).price, 0).toLocaleString()} separately.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {subtotal > 0 && (
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Boosts subtotal</span>
                                        <span className="font-semibold text-slate-900">₦{subtotal.toLocaleString()}</span>
                                    </div>
                                )}
                            </section>
                        )
                    })()}
                </>
            )}

            {/* SERVICE-ONLY: Price range */}
            {isService && (
                <div className="my-6 max-w-xl">
                    <span className="text-slate-700 font-medium">Price range</span>
                    <p className="text-xs text-slate-400 mb-2">Buyers see this as &quot;from {currency}X – {currency}Y&quot;. Use a wide range if jobs vary.</p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="text-xs text-slate-500">From ({currency})</span>
                            <input type="number" name="priceMin" onChange={onChangeHandler} value={productInfo.priceMin} placeholder="0" className="w-32 p-2 px-3 outline-none border border-slate-200 rounded" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            <span className="text-xs text-slate-500">To ({currency})</span>
                            <input type="number" name="priceMax" onChange={onChangeHandler} value={productInfo.priceMax} placeholder="0" className="w-32 p-2 px-3 outline-none border border-slate-200 rounded" />
                        </label>
                        <div className="flex flex-col gap-1 text-sm w-40">
                            <span className="text-xs text-slate-500">Unit</span>
                            <Dropdown
                                value={productInfo.priceUnit}
                                onChange={(v) => setProductInfo({ ...productInfo, priceUnit: v })}
                                options={PRICE_UNITS}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICE-ONLY: Area covered + Response time */}
            {isService && (
                <div className="grid sm:grid-cols-2 gap-4 my-6 max-w-xl">
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Area covered</span>
                        <input type="text" name="areaCovered" onChange={onChangeHandler} value={productInfo.areaCovered} placeholder="e.g. Lagos, Ogun" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Response time</span>
                        <input type="text" name="responseTime" onChange={onChangeHandler} value={productInfo.responseTime} placeholder="e.g. Within 2 hours" className="w-full p-2 px-4 outline-none border border-slate-200 rounded" />
                    </label>
                </div>
            )}

            {/* SERVICE-ONLY: Portfolio */}
            {isService && (
                <div className="my-8">
                    <p className="text-slate-700 font-medium">Showcase past work</p>
                    <p className="text-xs text-slate-500 mt-0.5">Photos of jobs you&apos;ve completed. Up to 6.</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                        {portfolioImages.map((file, idx) => (
                            <div key={idx} className="relative size-24 sm:size-28 rounded-lg overflow-hidden ring-1 ring-slate-200">
                                <Image src={URL.createObjectURL(file)} alt={`work ${idx}`} fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePortfolioImage(idx)}
                                    aria-label="Remove"
                                    className="absolute top-1 right-1 size-6 rounded-full bg-white/95 ring-1 ring-slate-200 flex items-center justify-center text-slate-700 hover:text-rose-600"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ))}
                        {portfolioImages.length < 6 && (
                            <label className="size-24 sm:size-28 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 text-xs text-center px-2">
                                + Add photo
                                <input type="file" accept="image/*" multiple hidden onChange={e => addPortfolioFiles(e.target.files)} />
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* Location + Phone — applies to both */}
            <div className="grid sm:grid-cols-2 gap-4 my-6 max-w-xl">
                <div className="flex flex-col gap-2">
                    <span className="text-slate-700 font-medium">Location</span>
                    <Dropdown
                        value={productInfo.location}
                        onChange={(v) => setProductInfo({ ...productInfo, location: v })}
                        placeholder="Where you're based"
                        leftIcon={<MapPin size={15} className="text-slate-400 shrink-0" />}
                        options={LOCATIONS}
                    />
                </div>
                <label className="flex flex-col gap-2">
                    <span className="text-slate-700 font-medium">
                        Phone <span className="text-slate-400 font-normal text-sm">— optional</span>
                    </span>
                    <div className="flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-full px-4 py-2 focus-within:ring-slate-400 transition">
                        <Phone size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="tel"
                            name="phone"
                            onChange={onChangeHandler}
                            value={productInfo.phone}
                            placeholder="e.g. +234 802 000 0000"
                            className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400 min-w-0"
                            autoComplete="tel"
                        />
                    </div>
                    <span className="text-xs text-slate-400">Buyers can call you in addition to in-app messaging.</span>
                </label>
            </div>

            <button disabled={loading} className="bg-slate-900 text-white px-6 mt-7 py-2.5 hover:bg-slate-800 rounded-full transition disabled:opacity-50 font-medium">
                {submitLabel}
            </button>
        </form>
    )
}
