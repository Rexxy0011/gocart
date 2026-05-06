'use client'
// Re-uses the existing add-listing form inside the /pro layout so
// providers stay in their dashboard chrome while posting. The form is
// pathname-aware (see store/add-product/page.jsx postRedirect) — when
// it's mounted under /pro/* it routes the seller back to /pro after a
// successful post instead of /store/manage-product.
import AddProduct from '@/app/store/add-product/page'

export default function ProvidersAddService() {
    return <AddProduct />
}
