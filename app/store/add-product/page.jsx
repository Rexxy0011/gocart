'use client'
import { assets, carMakesModels, categoryGroups, serviceSpecialties, stateAreas } from "@/assets/assets"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { BadgeCheck, Car, Info, MapPin, Phone, Rocket, X, ShieldCheck } from "lucide-react"
import Dropdown from "@/components/Dropdown"
import MultiSelect from "@/components/MultiSelect"
import { createClient } from "@/lib/supabase/client"
import { uploadProductImages } from "@/lib/supabase/storage"
import { useUser } from "@/lib/auth/UserContext"
import { checkListingContent } from "@/lib/moderation"
import ReviewProgressOverlay from "@/components/ReviewProgressOverlay"
import { runVinCheck } from "@/app/actions/vin"
import { runImeiCheck } from "@/app/actions/imei"
import { createListing } from "@/app/actions/listings"

const VEHICLE_NUMERIC_FIELDS = new Set([
    'year', 'mileage', 'seats', 'doors', 'luggageCapacity',
    'enginePower', 'engineSize', 'topSpeed', 'acceleration',
    'fuelConsumption', 'fuelCapacity', 'co2Emissions',
])

const SERVICES_GROUP_NAME = 'Repairs & Services'
const serviceSet = new Set(categoryGroups.find(g => g.name === SERVICES_GROUP_NAME)?.items || [])

// "Vehicles" the group contains real motor vehicles AND parts / non-motor
// items (Bicycles, Heavy equipment, Car tyres, Car batteries, Parts &
// accessories). Only the motor-vehicle subset has a 17-char VIN, an
// engine, mileage, transmission, etc. Bicycles and parts post as plain
// products - no VIN banner, no vehicle-spec form, no vehicle JSONB.
const MOTOR_VEHICLE_CATEGORIES = new Set([
    'Sedans', 'SUVs', 'Buses', 'Trucks', 'Motorcycles', 'Tricycles',
])

const CONDITIONS = [
    { value: 'new',    label: 'New' },
    { value: 'as-new', label: 'As good as new' },
    { value: 'good',   label: 'Good condition' },
    { value: 'fair',   label: 'Fair condition' },
]

// Nigerian vehicle market uses its own vocabulary - "Tokunbo / Foreign used"
// vs. "Naija used" - and the generic as-new/good/fair scale doesn't map.
// When the chosen category is a vehicle, we swap to this list instead.
const VEHICLE_CONDITIONS = [
    { value: 'new',           label: 'New' },
    { value: 'foreign-used',  label: 'Foreign used' },
    { value: 'nigerian-used', label: 'Nigerian used' },
]

// Same idea for phones: the way Nigerians actually classify a used handset
// is by where it lived before, not by some abstract good/fair grade.
const PHONE_CONDITIONS = [
    { value: 'new-sealed',    label: 'Brand new (sealed)' },
    { value: 'open-box',      label: 'Open box (unused)' },
    { value: 'uk-used',       label: 'UK used' },
    { value: 'us-used',       label: 'US used' },
    { value: 'nigerian-used', label: 'Nigerian used' },
    { value: 'refurbished',   label: 'Refurbished' },
]

// IMEI verification only runs for conditions where there's something
// real to verify against - used / refurbished phones. New-sealed phones
// don't need it (and the seller shouldn't break the seal to read it).
const PHONE_CONDITIONS_NEEDING_IMEI = new Set([
    'uk-used', 'us-used', 'nigerian-used', 'refurbished',
])

// Phones get the same care vehicles do. Categories scoped here trigger
// the phone-spec block + the IMEI banner.
const PHONE_CATEGORIES = new Set(['iPhones', 'Androids'])

const PHONE_BRANDS = [
    'Apple', 'Samsung', 'Tecno', 'Infinix', 'itel', 'Xiaomi', 'Oppo',
    'Vivo', 'Realme', 'Nokia', 'Huawei', 'Google', 'OnePlus', 'Other',
].map(b => ({ value: b, label: b }))

const PHONE_STORAGE_OPTIONS = [
    '16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB',
].map(s => ({ value: s, label: s }))

const PHONE_RAM_OPTIONS = [
    '1 GB', '2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB',
].map(r => ({ value: r, label: r }))

const PHONE_NETWORK_LOCK = [
    { value: 'unlocked',     label: 'Unlocked' },
    { value: 'mtn',          label: 'Locked to MTN' },
    { value: 'glo',          label: 'Locked to Glo' },
    { value: 'airtel',       label: 'Locked to Airtel' },
    { value: '9mobile',      label: 'Locked to 9mobile' },
    { value: 'foreign-lock', label: 'Foreign carrier lock' },
]

const PHONE_ACCESSORIES = [
    'Box', 'Charger', 'Cable', 'EarPods / Earphones', 'SIM tool', 'Screen protector',
]

const PRICE_UNITS = [
    { value: 'job',   label: 'per job' },
    { value: 'hour',  label: 'per hour' },
    { value: 'quote', label: 'quote on request' },
]

const LOCATION_STATES = Object.keys(stateAreas).map(c => ({ value: c, label: c }))

const TRANSMISSIONS = [
    { value: 'Manual',    label: 'Manual' },
    { value: 'Automatic', label: 'Automatic' },
    { value: 'Semi-Auto', label: 'Semi-automatic' },
    { value: 'CVT',       label: 'CVT' },
]

const BODY_TYPES = [
    { value: 'Hatchback', label: 'Hatchback' },
    { value: 'Sedan',     label: 'Sedan' },
    { value: 'SUV',       label: 'SUV' },
    { value: 'Coupe',     label: 'Coupe' },
    { value: 'Estate',    label: 'Estate / Wagon' },
    { value: 'Convertible', label: 'Convertible' },
    { value: 'Pickup',    label: 'Pickup' },
    { value: 'Van',       label: 'Van' },
    { value: 'Bus',       label: 'Bus' },
    { value: 'Motorbike', label: 'Motorbike' },
]

const FUEL_TYPES = [
    { value: 'Petrol',  label: 'Petrol' },
    { value: 'Diesel',  label: 'Diesel' },
    { value: 'Hybrid',  label: 'Hybrid' },
    { value: 'Electric', label: 'Electric' },
    { value: 'CNG',     label: 'CNG' },
    { value: 'LPG',     label: 'LPG' },
]

const EURO_EMISSIONS_LEVELS = [
    { value: 'Euro 6', label: 'Euro 6' },
    { value: 'Euro 5', label: 'Euro 5' },
    { value: 'Euro 4', label: 'Euro 4' },
    { value: 'Euro 3', label: 'Euro 3' },
    { value: 'Euro 2', label: 'Euro 2' },
    { value: 'Euro 1', label: 'Euro 1' },
]

export default function StoreAddProduct() {

    const router = useRouter()
    const pathname = usePathname()
    // After a successful post, route back to wherever the user came from:
    // providers stay inside their /pro dashboard; sellers land on
    // /store/manage-product. The form is mounted at both paths.
    const isProviderRoute = pathname?.startsWith('/pro/')
    const postRedirect = isProviderRoute ? '/pro' : '/store/manage-product'
    // Category split: providers post services only (Repairs & Services
    // group); /store/add-product is for products, so we hide the services
    // group there. Keeps each surface focused.
    const categoryGroupsForRoute = isProviderRoute
        ? categoryGroups.filter(g => g.name === SERVICES_GROUP_NAME)
        : categoryGroups.filter(g => g.name !== SERVICES_GROUP_NAME)
    const supabase = createClient()
    const user = useUser()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦'

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
        specialties: [],
        responseTime: "",
        // Up to 4 neighborhoods inside the same locationState. Stored as an
        // array on service.areaCovered (JSONB-friendly).
        areaCovered: [],
        locationState: "",
        locationArea: "",
        // Seller's contact phone (string). Distinct from the `phone` spec
        // object below - they used to collide under the same key.
        contactPhone: "",
        // Vehicle-specific - only filled when category is a vehicle.
        // Mirrors the fields rendered by VehicleSpecs on the product detail page.
        vehicle: {
            vin: "",
            make: "", model: "",
            year: "", mileage: "", bodyType: "", transmission: "",
            colour: "", seats: "", doors: "", luggageCapacity: "",
            fuelType: "", enginePower: "", engineSize: "", topSpeed: "", acceleration: "",
            fuelConsumption: "", fuelCapacity: "", insuranceGroup: "", co2Emissions: "", euroEmissions: "",
        },
        // Phone-specific - only filled when category is iPhones / Androids.
        phone: {
            imei: "",
            brand: "", model: "",
            storage: "", ram: "", colour: "",
            batteryHealth: "",                  // iPhones especially - null for non-iOS
            networkLock: "",
            accessories: [],                    // multi-select chips
            warranty: "",                       // free text
        },
    })


    const setVehicleField = (key, value) => {
        setProductInfo((p) => ({ ...p, vehicle: { ...p.vehicle, [key]: value } }))
    }

    const setPhoneField = (key, value) => {
        setProductInfo((p) => ({ ...p, phone: { ...p.phone, [key]: value } }))
    }

    const togglePhoneAccessory = (label) => {
        setProductInfo((p) => {
            const have = p.phone.accessories.includes(label)
            return {
                ...p,
                phone: {
                    ...p.phone,
                    accessories: have
                        ? p.phone.accessories.filter(a => a !== label)
                        : [...p.phone.accessories, label],
                },
            }
        })
    }

    // Decoded NHTSA payload, fetched silently inside the submit flow when
    // the seller has typed a 17-char VIN. Used to back-fill blank vehicle
    // fields before insert.
    const mergeDecodedIntoVehicle = (vehicle, d) => {
        const v = { ...vehicle }
        const fillIfEmpty = (key, val) => {
            if ((v[key] === '' || v[key] == null) && val != null && val !== '') v[key] = String(val)
        }
        fillIfEmpty('make',       d.make)
        fillIfEmpty('model',      d.model)
        fillIfEmpty('year',       d.modelYear)
        fillIfEmpty('engineSize', d.engineCc)
        fillIfEmpty('bodyType',   d.bodyClass)
        if (d.fuelType) {
            const f = d.fuelType.toLowerCase()
            if      (f.includes('diesel'))                        fillIfEmpty('fuelType', 'Diesel')
            else if (f.includes('electric'))                      fillIfEmpty('fuelType', 'Electric')
            else if (f.includes('hybrid'))                        fillIfEmpty('fuelType', 'Hybrid')
            else if (f.includes('gasoline') || f.includes('petrol')) fillIfEmpty('fuelType', 'Petrol')
        }
        if (d.transmission) {
            const t = d.transmission.toLowerCase()
            if      (t.includes('automatic') || t.includes('auto')) fillIfEmpty('transmission', 'Automatic')
            else if (t.includes('manual'))                          fillIfEmpty('transmission', 'Manual')
        }
        return v
    }
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(null)
    // Holds the post-publish review_status ('approved' | 'pending') so the
    // overlay can show the right result. null = overlay hidden.
    const [reviewState, setReviewState] = useState(null)

    const isService = useMemo(() => serviceSet.has(productInfo.category), [productInfo.category])
    // Motor vehicle = the subset of the Vehicles group that has a real VIN
    // and an engine. Bicycles / parts / tyres / batteries / heavy equipment
    // stay in the Vehicles group for browsing but render as plain products
    // with no VIN flow and no vehicle-spec block.
    const isVehicle = useMemo(() => MOTOR_VEHICLE_CATEGORIES.has(productInfo.category), [productInfo.category])
    const isPhone   = useMemo(() => PHONE_CATEGORIES.has(productInfo.category), [productInfo.category])
    // Show / run the IMEI flow only when both: it's a phone AND the
    // claimed condition is one of the used / refurbished values.
    const phoneNeedsImei = isPhone && PHONE_CONDITIONS_NEEDING_IMEI.has(productInfo.condition)
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

    // Generate a /shop/ URL handle from a name. Strips diacritics, lowercases,
    // collapses non-alphanumeric runs into hyphens, trims, caps at 14 chars,
    // appends a 4-char random suffix to keep collisions vanishingly rare.
    const generateUsername = (raw) => {
        const slug = (raw || 'seller')
            .toLowerCase()
            .normalize('NFKD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 14) || 'seller'
        const suffix = Math.random().toString(36).slice(2, 6)
        return `${slug}-${suffix}`
    }

    // Resolve the seller's store, creating one on first post if it doesn't
    // exist. Individual sellers don't go through a separate "shop setup"
    // ceremony - their /shop/[username] profile is born the moment they
    // post their first listing.
    const resolveOrCreateStore = async () => {
        const existing = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (existing.data) return { store: existing.data, error: null }
        if (existing.error) return { store: null, error: existing.error }

        const displayName = user.user_metadata?.name || (user.email?.split('@')[0]) || 'Seller'
        const created = await supabase
            .from('stores')
            .insert({
                user_id: user.id,
                name: displayName,
                username: generateUsername(displayName),
                // NOT NULL columns we don't yet collect - sensible empty
                // defaults; user can edit later in /store profile.
                description: '',
                address: isServiceMode
                    ? productInfo.locationState
                    : `${productInfo.locationState} · ${productInfo.locationArea}`,
                email: user.email || '',
                contact: productInfo.contactPhone || '',
                logo: '',
                // Admin reviews each shop once via /admin/approve. Until then
                // status stays 'pending' (the DB default) and listings carry
                // a "Pending review" badge in buyer-facing UI.
                is_active: true,
            })
            .select('id')
            .single()

        return { store: created.data, error: created.error }
    }

    const buildVehiclePayload = (raw) => {
        const out = {}
        for (const [key, value] of Object.entries(raw)) {
            if (value === '' || value == null) continue
            out[key] = VEHICLE_NUMERIC_FIELDS.has(key) ? Number(value) : value
        }
        return Object.keys(out).length ? out : null
    }

    const buildServicePayload = (portfolioUrls = []) => ({
        priceRange: {
            min: productInfo.priceMin ? Number(productInfo.priceMin) : null,
            max: productInfo.priceMax ? Number(productInfo.priceMax) : null,
            unit: productInfo.priceUnit,
        },
        specialties: productInfo.specialties,
        responseTime: productInfo.responseTime || null,
        areaCovered: productInfo.areaCovered.length ? productInfo.areaCovered : null,
        portfolio: portfolioUrls.length ? portfolioUrls : null,
    })

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (loading) return
        if (!user) {
            toast.error('You need to be signed in to post a listing.')
            return
        }

        // For services we lock the title to the chosen category - buyers
        // can't be misled by the headline because we wrote it. For products,
        // we run the user-typed title through the keyword screen.
        const effectiveName = isService ? productInfo.category : productInfo.name

        // 0. Pre-publish content screen. Catches obvious banned keywords
        // before we charge for image uploads. Server-side enforcement comes
        // when we move the insert through a server action.
        const screen = checkListingContent(effectiveName, productInfo.description)
        if (!screen.ok) {
            toast.error(screen.message)
            return
        }

        // 1. Require state + area - area is a primary search filter, so
        // unspecified locations would dilute every neighborhood's feed.
        if (!productInfo.locationState) {
            toast.error('Pick a state.')
            return
        }
        if (!isServiceMode && !productInfo.locationArea) {
            toast.error('Pick the area within the state - buyers filter by neighborhood.')
            return
        }
        // Services use the portfolio gallery as their visual identity -
        // first image becomes the cover. Without one, the listing card
        // would render an empty placeholder.
        if (isService && portfolioImages.length === 0) {
            toast.error('Add at least one photo of past work - the first becomes your cover.')
            return
        }

        setLoading(true)

        // 1. Resolve the seller's store, creating one inline if it's their
        // first post. No separate setup ceremony for individual sellers.
        const { store, error: storeErr } = await resolveOrCreateStore()

        if (storeErr || !store) {
            toast.error(storeErr?.message || 'Could not set up your shop.')
            setLoading(false)
            return
        }

        // 2. Upload images. Two cases:
        //    - Products: the 4-slot "Photos" picker → uploaded into
        //      product.images (first = cover).
        //    - Services: the portfolio gallery is the only image source.
        //      We upload it once, mirror the URLs into BOTH product.images
        //      (so cards / detail pages have a cover) AND service.portfolio
        //      (so the detail page renders the past-work gallery).
        let imageUrls = []
        let portfolioUrls = []
        const productFiles = isService ? [] : Object.values(images).filter(Boolean)
        const portfolioFiles = isService ? portfolioImages : []

        if (productFiles.length || portfolioFiles.length) {
            const fileList = productFiles.length ? productFiles : portfolioFiles
            try {
                const urls = await uploadProductImages(fileList, user.id, {
                    onProgress: ({ done, total }) => setUploadProgress({ done, total }),
                })
                if (isService) {
                    portfolioUrls = urls
                    imageUrls = urls.slice(0, 1)  // first portfolio image = cover
                } else {
                    imageUrls = urls
                }
            } catch (err) {
                toast.error(err?.message || 'Image upload failed.')
                setLoading(false)
                setUploadProgress(null)
                return
            } finally {
                setUploadProgress(null)
            }
        }

        // 3. Run the VIN check inline before insert. Decoded fields fill any
        // gaps the seller didn't type. We never block the listing on a flaky
        // NHTSA call - failure here just skips the auto-fill and leaves
        // payload.vin set so the report can populate later. (The product
        // page reads vin_reports lazily when it first renders, but doing it
        // here means by the time the buyer arrives the row is already cached.)
        let mergedVehicle = productInfo.vehicle
        const vinTyped = (productInfo.vehicle.vin || '').toUpperCase()
        if (isVehicle && vinTyped.length === 17) {
            try {
                const result = await runVinCheck({ vin: vinTyped })
                if (result?.ok && result.report?.decoded) {
                    mergedVehicle = mergeDecodedIntoVehicle(productInfo.vehicle, result.report.decoded)
                }
            } catch {
                // Network blip on NHTSA shouldn't block the ad.
            }
        }

        // Same idea for phones - runs only when the condition warrants
        // verification (new sealed / open box are skipped).
        const imeiTyped = (productInfo.phone.imei || '').replace(/\D/g, '')
        if (phoneNeedsImei && imeiTyped.length === 15) {
            try {
                const result = await runImeiCheck({ imei: imeiTyped })
                if (result?.error) {
                    // A bad Luhn here means the seller mistyped the IMEI.
                    // Block submission so they can fix it - unlike VIN
                    // failures (network blips), Luhn is deterministic and
                    // a bad IMEI is the seller's typo, not a flaky API.
                    toast.error(result.error)
                    setLoading(false)
                    return
                }
            } catch {
                // External API blip is non-fatal - Luhn already ran, the
                // product can post and the report will populate next time.
            }
        }

        // 4. Build the products row from the (possibly-merged) form state.
        const payload = {
            store_id: store.id,
            name: effectiveName.trim(),
            description: (productInfo.description || '').trim() || null,
            category: productInfo.category,
            location: isServiceMode
                ? productInfo.locationState
                : `${productInfo.locationState} · ${productInfo.locationArea}`,
            images: imageUrls,
            in_stock: true,

            // Pricing - services with quote-on-request leave price null.
            free: productInfo.free,
            price: productInfo.free
                ? 0
                : (isService
                    ? null
                    : (productInfo.price !== '' ? Number(productInfo.price) : null)),
            was_price: productInfo.wasPrice !== '' ? Number(productInfo.wasPrice) : null,

            // Universal flags
            condition: !isService ? (productInfo.condition || null) : null,
            delivery_available: productInfo.deliveryAvailable,

            // Phone-specific blob and IMEI. IMEI is only attached if the
            // condition warrants verification - new sealed phones get to
            // skip the entire flow (and shouldn't be forced to break a
            // factory seal to read the IMEI sticker).
            phone: isPhone ? {
                brand:         productInfo.phone.brand || null,
                model:         (productInfo.phone.model || '').trim() || null,
                storage:       productInfo.phone.storage || null,
                ram:           productInfo.phone.ram || null,
                colour:        (productInfo.phone.colour || '').trim() || null,
                batteryHealth: productInfo.phone.batteryHealth !== '' ? Number(productInfo.phone.batteryHealth) : null,
                networkLock:   productInfo.phone.networkLock || null,
                accessories:   productInfo.phone.accessories || [],
                warranty:      (productInfo.phone.warranty || '').trim() || null,
            } : null,
            imei: (phoneNeedsImei && (productInfo.phone.imei || '').length === 15)
                ? productInfo.phone.imei
                : null,

            // Type-specific blobs
            service: isService ? buildServicePayload(portfolioUrls) : null,
            vehicle: isVehicle ? buildVehiclePayload(mergedVehicle) : null,
            vin:     (isVehicle && vinTyped.length === 17) ? vinTyped : null,
        }

        // Insert through the createListing server action - the only
        // products-insert path (raw PostgREST inserts are revoked, see
        // migration 0023). It whitelists fields, re-runs the content
        // screen, and returns review_status so we can tell the seller
        // whether the listing is live or held in the admin queue (the
        // auto_review_listing trigger may flip 'pending' → 'approved').
        const result = await createListing(payload)

        setLoading(false)

        if (result.error) {
            toast.error(result.error || 'Could not post listing.')
            return
        }

        // Show the animated review overlay. It auto-routes to
        // /store/manage-product once the animation finishes. The VIN /
        // phone re-listing trails are recorded inside createListing,
        // server-side, so they survive this component unmounting.
        setReviewState(result.reviewStatus)
    }

    // On /pro/add-service we *always* show service copy - even before a
    // category is picked - because the route itself committed the user to
    // posting a service. On /store/add-product the copy follows whatever
    // category they actually choose. `isServiceMode` is the unified flag.
    const isServiceMode = isProviderRoute || isService
    const headerTitle = isServiceMode ? 'Offer your service' : 'Post an ad'
    const submitLabel = isServiceMode ? 'Publish service' : 'Post ad'

    const loadingLabel = uploadProgress
        ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
        : 'Posting…'

    return (
        <>
            {/* Review-pipeline overlay - appears for ~2.5s after a successful
                post, then routes to /store/manage-product. */}
            {reviewState && (
                <ReviewProgressOverlay
                    status={reviewState}
                    onComplete={() => {
                        router.push(postRedirect)
                        router.refresh()
                    }}
                />
            )}

            <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: loadingLabel })} className="text-slate-500 mb-28 max-w-2xl">

                {/* Header */}
                <h1 className="text-2xl text-slate-900 font-semibold">{headerTitle}</h1>

            {/* How it works - sets the classifieds expectation */}
            <div className="mt-4 mb-7 bg-slate-50 ring-1 ring-slate-200 rounded-lg p-4 flex items-start gap-3">
                <Info size={16} className="text-slate-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">How it works:</span>{' '}
                    Buyers contact you directly through Kakimart messaging. We don&apos;t take any cut on offline sales - listing is free and stays free.
                </p>
            </div>

            {/* Category - first, because it drives everything else */}
            <label className="flex flex-col gap-2 my-6">
                <span className="text-slate-700 font-medium">Category</span>
                <select onChange={onCategoryChange} value={productInfo.category} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required>
                    <option value="">Select a category</option>
                    {categoryGroupsForRoute.map((group) => (
                        <optgroup key={group.name} label={group.name}>
                            {group.items.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {isService && (
                    <span className="text-xs text-emerald-700">This is a service listing - provider-specific fields appear below.</span>
                )}
            </label>

            {/* Vehicle perk - Free VIN check */}
            {isVehicle && (
                <div className="mb-6 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 max-w-xl">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0">
                            <Car size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-900">Want to be more transparent and sell quicker?</p>
                            <p className="text-xs text-emerald-900/80 mt-0.5">
                                Add your car&apos;s VIN and we&apos;ll attach a free history report (mileage, accidents, ownership) to your ad - buyers trust faster.
                            </p>
                            <input
                                value={productInfo.vehicle.vin}
                                onChange={(e) => setVehicleField(
                                    'vin',
                                    e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17),
                                )}
                                placeholder="e.g. 1HGBH41JXMN109186"
                                maxLength={17}
                                className="mt-3 w-full text-sm bg-white ring-1 ring-emerald-200 focus:ring-emerald-500 rounded-md px-3 py-2 outline-none transition font-mono uppercase tracking-wide"
                            />
                            <p className="mt-1.5 text-[11px] text-emerald-900/70">
                                We&apos;ll verify the VIN and build the report automatically when you post the ad.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Phone perk - Free IMEI check (only for used / refurbished
                phones; new sealed phones don't need it). */}
            {phoneNeedsImei && (
                <div className="mb-6 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl p-4 max-w-xl">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-full bg-emerald-600 text-white shrink-0">
                            <BadgeCheck size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-900">Sell quicker with a verified IMEI</p>
                            <p className="text-xs text-emerald-900/80 mt-0.5">
                                Add the IMEI (dial *#06# on the phone) and we&apos;ll attach a free verification - brand match, checksum, and any past listings on Kakimart - to your ad. Buyers trust verified used phones faster.
                            </p>
                            <input
                                value={productInfo.phone.imei}
                                onChange={(e) => setPhoneField('imei', e.target.value.replace(/\D/g, '').slice(0, 15))}
                                placeholder="15-digit IMEI"
                                maxLength={15}
                                inputMode="numeric"
                                className="mt-3 w-full text-sm bg-white ring-1 ring-emerald-200 focus:ring-emerald-500 rounded-md px-3 py-2 outline-none transition font-mono tracking-wide"
                            />
                            <p className="mt-1.5 text-[11px] text-emerald-900/70">
                                We&apos;ll verify the IMEI automatically when you post the ad.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Phone-specific spec fields */}
            {isPhone && (
                <div className="my-6 max-w-xl">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Phone details</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600">Brand *</span>
                            <Dropdown
                                value={productInfo.phone.brand}
                                onChange={(v) => setPhoneField('brand', v)}
                                placeholder="Pick brand"
                                options={PHONE_BRANDS}
                            />
                        </div>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600">Model *</span>
                            <input
                                type="text"
                                value={productInfo.phone.model}
                                onChange={(e) => setPhoneField('model', e.target.value)}
                                placeholder="e.g. iPhone 13 Pro / Galaxy S24 Ultra"
                                className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                            />
                        </label>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600">Storage</span>
                            <Dropdown
                                value={productInfo.phone.storage}
                                onChange={(v) => setPhoneField('storage', v)}
                                placeholder="Pick storage"
                                options={PHONE_STORAGE_OPTIONS}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600">RAM</span>
                            <Dropdown
                                value={productInfo.phone.ram}
                                onChange={(v) => setPhoneField('ram', v)}
                                placeholder="Pick RAM"
                                options={PHONE_RAM_OPTIONS}
                            />
                        </div>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs text-slate-600">Colour</span>
                            <input
                                type="text"
                                value={productInfo.phone.colour}
                                onChange={(e) => setPhoneField('colour', e.target.value)}
                                placeholder="e.g. Sierra Blue"
                                className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                            />
                        </label>
                        {productInfo.phone.brand === 'Apple' && (
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs text-slate-600">Battery health % <span className="text-slate-400">(iPhone)</span></span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={productInfo.phone.batteryHealth}
                                    onChange={(e) => setPhoneField('batteryHealth', e.target.value)}
                                    placeholder="e.g. 92"
                                    className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                />
                            </label>
                        )}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-xs text-slate-600">Network lock</span>
                            <Dropdown
                                value={productInfo.phone.networkLock}
                                onChange={(v) => setPhoneField('networkLock', v)}
                                placeholder="Pick lock status"
                                options={PHONE_NETWORK_LOCK}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <span className="text-xs text-slate-600">Box & accessories included</span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {PHONE_ACCESSORIES.map((a) => {
                                    const active = productInfo.phone.accessories.includes(a)
                                    return (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => togglePhoneAccessory(a)}
                                            className={`text-xs ring-1 rounded-full px-2.5 py-1 transition ${
                                                active
                                                    ? 'bg-slate-900 text-white ring-slate-900'
                                                    : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-400'
                                            }`}
                                        >
                                            {a}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-xs text-slate-600">Warranty / coverage</span>
                            <input
                                type="text"
                                value={productInfo.phone.warranty}
                                onChange={(e) => setPhoneField('warranty', e.target.value)}
                                placeholder="e.g. AppleCare+ until Jan 2027 · No warranty"
                                className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                            />
                        </label>
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

            {/* Photos - products only. For services the "Showcase past
                work" portfolio block (further down) drives both the cover
                and the gallery, so we don't show this section there. */}
            {!isServiceMode && (
                <div className="my-6">
                    <p className="text-slate-700 font-medium">Photos</p>
                    <p className="text-xs text-slate-500 mt-0.5">Add up to 4 - first photo is the cover. Clear photos = more replies.</p>
                    <div className="flex gap-3 mt-3">
                        {Object.keys(images).map((key) => (
                            <label key={key} htmlFor={`images${key}`}>
                                <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                                <input type="file" accept='image/*' id={`images${key}`} onChange={e => setImages({ ...images, [key]: e.target.files[0] })} hidden />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Title - products only. Free-form input lets sellers
                describe the item. Services use a fixed, derived title
                (the chosen category) to prevent misuse / spammy
                self-promotion / clickbait headlines. */}
            {!isServiceMode && (
                <label className="flex flex-col gap-2 my-6">
                    <span className="text-slate-700 font-medium">Ad title</span>
                    <input
                        type="text"
                        name="name"
                        onChange={onChangeHandler}
                        value={productInfo.name}
                        placeholder='e.g. iPhone 13 Pro 256GB, Pacific Blue - like new'
                        className="w-full max-w-xl p-2 px-4 outline-none border border-slate-200 rounded"
                        required
                    />
                    <span className="text-xs text-slate-400">Short and specific - what it is, key feature, condition.</span>
                </label>
            )}
            {isService && productInfo.category && (
                <div className="my-6 max-w-xl">
                    <p className="text-slate-700 font-medium">Listing title</p>
                    <p className="text-base text-slate-900 mt-2 px-3 py-2 bg-slate-50 ring-1 ring-slate-200 rounded">
                        {productInfo.category}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">Title is locked to the category to keep search clean. Tell buyers more in “About this service” below.</p>
                </div>
            )}

            {/* Description */}
            <label className="flex flex-col gap-2 my-6">
                <span className="text-slate-700 font-medium">{isServiceMode ? 'About this service' : 'Description'}</span>
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    placeholder={isServiceMode
                        ? 'What you do, your process, what buyers can expect, your typical response time.'
                        : 'Condition details, what\'s included, why you\'re selling, collection or delivery preferences.'}
                    rows={5}
                    className="w-full max-w-xl p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                    required
                />
            </label>

            {/* PRODUCT-ONLY: Condition + Delivery */}
            {!isServiceMode && (
                <div className="grid sm:grid-cols-2 gap-4 my-6 max-w-xl">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Condition</span>
                        <Dropdown
                            value={productInfo.condition}
                            onChange={(v) => setProductInfo({ ...productInfo, condition: v })}
                            placeholder="Select condition"
                            leftIcon={<BadgeCheck size={15} className="text-slate-400 shrink-0" />}
                            options={isVehicle ? VEHICLE_CONDITIONS : isPhone ? PHONE_CONDITIONS : CONDITIONS}
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

            {/* PRICE - products */}
            {!isServiceMode && (
                <>
                    <label className="flex items-center gap-3 my-6 cursor-pointer max-w-xl">
                        <input
                            type="checkbox"
                            checked={productInfo.free}
                            onChange={(e) => setProductInfo({
                                ...productInfo,
                                free: e.target.checked,
                                ...(e.target.checked ? { price: "", wasPrice: "" } : {}),
                            })}
                            className="size-4"
                        />
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide rounded px-2 py-0.5">FREE</span>
                        <span className="text-sm text-slate-700">List as a free giveaway</span>
                    </label>

                    {productInfo.free ? (
                        <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-lg p-3 max-w-xl mb-6 text-sm text-emerald-900">
                            Listed as <span className="font-semibold">Free</span> - buyers see a green FREE tag. Pricing and Sell-quicker boosts don&apos;t apply to giveaways.
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
                                    <span className="text-slate-500 text-sm">Was ({currency}) <span className="text-slate-400">- optional</span></span>
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

                    {/* Vehicle specs - only when category is in the Vehicles group */}
                    {isVehicle && (
                        <section className="my-8 max-w-2xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Car size={15} className="text-slate-700" />
                                <h3 className="text-sm font-semibold text-slate-900">Vehicle details</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-5">
                                These show up in the spec tabs (Overview / Performance / Running Costs) on the listing. Only Make, Model, Year, Mileage, Body, Transmission and Fuel are required - fill what you know.
                            </p>

                            {/* Make + Model - most important identifiers; come
                                first so the rest of the form feels natural.
                                Changing make resets model so we never end up
                                with Toyota Accord. */}
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-2 mb-3">Make &amp; model</p>
                            <div className="grid sm:grid-cols-2 gap-3 mb-5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Make *</span>
                                    <Dropdown
                                        value={productInfo.vehicle.make}
                                        onChange={(v) => setProductInfo((p) => ({
                                            ...p,
                                            vehicle: { ...p.vehicle, make: v, model: "" },
                                        }))}
                                        placeholder="Pick make"
                                        options={Object.keys(carMakesModels).map(m => ({ value: m, label: m }))}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Model *</span>
                                    <Dropdown
                                        value={productInfo.vehicle.model}
                                        onChange={(v) => setVehicleField('model', v)}
                                        placeholder={productInfo.vehicle.make ? 'Pick model' : 'Pick make first'}
                                        disabled={!productInfo.vehicle.make}
                                        options={(carMakesModels[productInfo.vehicle.make] || []).map(m => ({ value: m, label: m }))}
                                    />
                                </div>
                            </div>

                            {/* Overview */}
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-2 mb-3">Overview</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Year *</span>
                                    <input
                                        type="number"
                                        min="1900"
                                        max="2030"
                                        value={productInfo.vehicle.year}
                                        onChange={(e) => setVehicleField('year', e.target.value)}
                                        placeholder="e.g. 2014"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                        required
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Mileage * (miles)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.mileage}
                                        onChange={(e) => setVehicleField('mileage', e.target.value)}
                                        placeholder="e.g. 43700"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                        required
                                    />
                                </label>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Body type *</span>
                                    <Dropdown
                                        value={productInfo.vehicle.bodyType}
                                        onChange={(v) => setVehicleField('bodyType', v)}
                                        placeholder="Pick body type"
                                        options={BODY_TYPES}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Transmission *</span>
                                    <Dropdown
                                        value={productInfo.vehicle.transmission}
                                        onChange={(v) => setVehicleField('transmission', v)}
                                        placeholder="Pick transmission"
                                        options={TRANSMISSIONS}
                                    />
                                </div>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Colour</span>
                                    <input
                                        type="text"
                                        value={productInfo.vehicle.colour}
                                        onChange={(e) => setVehicleField('colour', e.target.value)}
                                        placeholder="e.g. Black"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Seats</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={productInfo.vehicle.seats}
                                        onChange={(e) => setVehicleField('seats', e.target.value)}
                                        placeholder="5"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Doors</span>
                                    <input
                                        type="number"
                                        min="2"
                                        max="6"
                                        value={productInfo.vehicle.doors}
                                        onChange={(e) => setVehicleField('doors', e.target.value)}
                                        placeholder="4"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Luggage capacity (litres)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.luggageCapacity}
                                        onChange={(e) => setVehicleField('luggageCapacity', e.target.value)}
                                        placeholder="e.g. 275"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                            </div>

                            {/* Performance */}
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-6 mb-3">Performance</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Fuel type *</span>
                                    <Dropdown
                                        value={productInfo.vehicle.fuelType}
                                        onChange={(v) => setVehicleField('fuelType', v)}
                                        placeholder="Pick fuel type"
                                        options={FUEL_TYPES}
                                    />
                                </div>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Engine size (cc)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.engineSize}
                                        onChange={(e) => setVehicleField('engineSize', e.target.value)}
                                        placeholder="e.g. 1368"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Engine power (bhp)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={productInfo.vehicle.enginePower}
                                        onChange={(e) => setVehicleField('enginePower', e.target.value)}
                                        placeholder="e.g. 76"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Top speed (mph)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.topSpeed}
                                        onChange={(e) => setVehicleField('topSpeed', e.target.value)}
                                        placeholder="e.g. 103"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5 sm:col-span-2">
                                    <span className="text-xs text-slate-600">Acceleration 0-62 mph (seconds)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={productInfo.vehicle.acceleration}
                                        onChange={(e) => setVehicleField('acceleration', e.target.value)}
                                        placeholder="e.g. 13.2"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                            </div>

                            {/* Running costs */}
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-6 mb-3">Running costs <span className="text-slate-400 font-normal normal-case">- optional</span></p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Fuel consumption (mpg)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={productInfo.vehicle.fuelConsumption}
                                        onChange={(e) => setVehicleField('fuelConsumption', e.target.value)}
                                        placeholder="e.g. 49.6"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Fuel capacity (litres)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.fuelCapacity}
                                        onChange={(e) => setVehicleField('fuelCapacity', e.target.value)}
                                        placeholder="e.g. 45"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">Insurance group</span>
                                    <input
                                        type="text"
                                        value={productInfo.vehicle.insuranceGroup}
                                        onChange={(e) => setVehicleField('insuranceGroup', e.target.value)}
                                        placeholder="e.g. 11D"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs text-slate-600">CO₂ emissions (g/km)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={productInfo.vehicle.co2Emissions}
                                        onChange={(e) => setVehicleField('co2Emissions', e.target.value)}
                                        placeholder="e.g. 132"
                                        className="p-2 px-3 outline-none border border-slate-200 rounded text-sm"
                                    />
                                </label>
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <span className="text-xs text-slate-600">Euro emissions standard</span>
                                    <Dropdown
                                        value={productInfo.vehicle.euroEmissions}
                                        onChange={(v) => setVehicleField('euroEmissions', v)}
                                        placeholder="Pick standard"
                                        options={EURO_EMISSIONS_LEVELS}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Boost teaser - actual purchase happens from the dashboard
                        once the listing is posted, so we don't take payment in
                        the same flow as the post-an-ad form. */}
                    {!productInfo.free && (
                        <section className="my-8 max-w-xl bg-slate-50 ring-1 ring-slate-200 rounded-xl p-4 flex items-start gap-3">
                            <Rocket size={16} className="text-sky-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">Sell quicker with boosts</p>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Once your ad is posted, you can boost it from your dashboard - Bump up, Featured, Urgent, Bulk sale, or the Boost bundle. Listing itself is free.
                                </p>
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* SERVICE-ONLY: Price range */}
            {isService && (
                <div className="my-6 max-w-xl">
                    <span className="text-slate-700 font-medium">Price range</span>
                    <p className="text-xs text-slate-400 mb-2">Buyers see this as &quot;from {currency}X - {currency}Y&quot;. Use a wide range if jobs vary.</p>
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

            {/* Location - Jiji-style state + area picker. Area depends on
                state: changing state resets area so we never end up with a
                Lagos · Wuse mismatch.
                Services skip the per-listing Area picker entirely - the
                "Areas you cover" multi-select (right below) handles their
                geography instead. State sits directly above Areas-you-cover
                so the dependency reads naturally: pick state → pick areas. */}
            <div className={`grid ${isServiceMode ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-4 my-6 max-w-xl`}>
                <div className="flex flex-col gap-2">
                    <span className="text-slate-700 font-medium">State</span>
                    <Dropdown
                        value={productInfo.locationState}
                        onChange={(v) => setProductInfo({ ...productInfo, locationState: v, locationArea: "", areaCovered: [] })}
                        placeholder="Pick state"
                        leftIcon={<MapPin size={15} className="text-slate-400 shrink-0" />}
                        options={LOCATION_STATES}
                    />
                </div>
                {!isServiceMode && (
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Area</span>
                        <Dropdown
                            value={productInfo.locationArea}
                            onChange={(v) => setProductInfo({ ...productInfo, locationArea: v })}
                            placeholder={productInfo.locationState ? 'Pick area' : 'Pick state first'}
                            disabled={!productInfo.locationState}
                            options={(stateAreas[productInfo.locationState] || []).map(a => ({ value: a, label: a }))}
                        />
                    </div>
                )}
            </div>

            {/* SERVICE-ONLY: Areas covered + Response time. Areas are
                limited to neighborhoods inside the locationState selected
                above - buyers filtering by neighborhood expect a service to
                actually serve there. Cap of 4 keeps providers honest. */}
            {isService && (
                <div className="grid sm:grid-cols-2 gap-4 my-6 max-w-xl">
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-700 font-medium">Areas you cover</span>
                        <MultiSelect
                            value={productInfo.areaCovered}
                            onChange={(next) => setProductInfo({ ...productInfo, areaCovered: next })}
                            options={(stateAreas[productInfo.locationState] || []).map(a => ({ value: a, label: a }))}
                            placeholder={productInfo.locationState ? `Pick areas in ${productInfo.locationState}` : 'Pick state first'}
                            disabled={!productInfo.locationState}
                            max={4}
                            leftIcon={<MapPin size={15} className="text-slate-400 shrink-0" />}
                        />
                        <p className="text-xs text-slate-400">Up to 4 neighborhoods inside {productInfo.locationState || 'your state'}.</p>
                    </div>
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

            <div className="my-6 max-w-xl">
                <label className="flex flex-col gap-2">
                    <span className="text-slate-700 font-medium">
                        Phone <span className="text-slate-400 font-normal text-sm">- optional</span>
                    </span>
                    <div className="flex items-center gap-2 bg-white ring-1 ring-slate-200 rounded-full px-4 py-2 focus-within:ring-slate-400 transition max-w-sm">
                        <Phone size={15} className="text-slate-400 shrink-0" />
                        <input
                            type="tel"
                            name="contactPhone"
                            onChange={onChangeHandler}
                            value={productInfo.contactPhone}
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
        </>
    )
}
