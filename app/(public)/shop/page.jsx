import { Suspense } from "react"
import ProductCard from "@/components/ProductCard"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from "@/lib/supabase/mappers"
import { categoryGroups } from "@/assets/assets"
import ShopHeader from "./ShopHeader"

// Build a lookup once: group-name → array of leaf categories. Lets us
// expand a "?category=Vehicles" link into ["Sedans","SUVs",…] so group
// chips match every leaf listing under them.
const GROUP_TO_ITEMS = Object.fromEntries(
    categoryGroups.map(g => [g.name, g.items]),
)

// Browse-everyone view. Reads only listings whose shop has been admin-approved
// AND is active. Services are excluded (they live on /services). Sort order:
// featured first, then most-recently-bumped, then newest.
//
// Server component so the initial render is the actual filtered set — no
// loading flash. The header / search-back affordance is a tiny client child.
export default async function Shop({ searchParams }) {

    const params = await searchParams
    const search = (params?.search || '').toString().trim()
    const category = (params?.category || '').toString().trim()
    const location = (params?.location || '').toString().trim()
    // Price filters — `min` / `max` are inclusive bounds, `free=true`
    // narrows to free-only listings (overrides min/max when both arrive).
    const minRaw = parseInt((params?.min || '').toString(), 10)
    const maxRaw = parseInt((params?.max || '').toString(), 10)
    const min  = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : null
    const max  = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null
    const free = (params?.free || '').toString() === 'true'

    const supabase = await createClient()

    let query = supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .is('service', null)
        .is('removed_at', null)
        .eq('review_status', 'approved')
        .eq('store.status', 'approved')
        .eq('store.is_active', true)
        .order('featured', { ascending: false })
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(60)

    if (search)   query = query.ilike('name', `%${search}%`)
    if (category) {
        // If it's a group name (Vehicles, Electronics, …), expand to the
        // leaf categories listings actually store. Otherwise treat it as
        // a leaf and exact-match.
        const items = GROUP_TO_ITEMS[category]
        if (items) query = query.in('category', items)
        else        query = query.eq('category', category)
    }
    // Prefix match — listings store "State · Area"; filtering by "Lagos"
    // should still surface every Lagos area, not just bare-state listings.
    if (location) query = query.ilike('location', `${location}%`)
    // Price gates. `free` short-circuits min/max because those don't
    // make sense alongside it (free listings have price = 0, but a
    // buyer asking for "free only" doesn't want to also type a max).
    if (free) {
        query = query.eq('free', true)
    } else {
        if (min != null) query = query.gte('price', min)
        if (max != null) query = query.lte('price', max)
    }

    const { data: rows } = await query
    const products = (rows || []).map(mapProductRow)

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={null}>
                    <ShopHeader search={search} />
                </Suspense>
                {products.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50/60 my-10">
                        <h2 className="text-lg font-semibold text-slate-900">No listings match</h2>
                        <p className="text-sm text-slate-600 mt-2">
                            {search || category || location
                                ? 'Try widening your search — clear filters or pick a different category.'
                                : 'Be the first — post an ad and it shows up here once reviewed.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-32">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
