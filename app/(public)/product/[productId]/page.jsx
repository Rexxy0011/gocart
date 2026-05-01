import { notFound } from "next/navigation"
import Link from "next/link"
import ProductDetails from "@/components/ProductDetails"
import RelatedListings from "@/components/RelatedListings"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from "@/lib/supabase/mappers"

export default async function Product({ params }) {

    const { productId } = await params
    const supabase = await createClient()

    // Don't filter on review_status here — RLS already enforces "approved
    // OR own" at the row level. That way the owner can view their own
    // pending listing (preview / share-link), but buyers still get a 404.
    const { data: row } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('id', productId)
        .is('removed_at', null)
        .maybeSingle()

    if (!row) notFound()

    // Pending shops aren't listed publicly. We could 404 these too, but
    // letting the seller themselves preview their own listing while it's
    // under review is fine UX. RLS will tighten this down later.
    const product = mapProductRow(row)

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto py-6">

                {/* Breadcrumbs */}
                <nav className="text-slate-600 text-sm mb-4 flex flex-wrap items-center gap-1">
                    <Link href="/" className="text-sky-700 hover:underline">Home</Link>
                    <span className="text-slate-400">/</span>
                    <Link href="/shop" className="text-sky-700 hover:underline">Listings</Link>
                    {product.category && (
                        <>
                            <span className="text-slate-400">/</span>
                            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="text-sky-700 hover:underline">
                                {product.category}
                            </Link>
                        </>
                    )}
                </nav>

                <ProductDetails product={product} />
                <RelatedListings product={product} />
            </div>
        </div>
    )
}
