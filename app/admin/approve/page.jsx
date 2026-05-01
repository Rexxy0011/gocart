import { createAdminClient } from "@/lib/supabase/admin"
import ApproveQueue from "./ApproveQueue"

// Risk-weighted categories — these float to the top of the queue. High
// abuse / fraud potential (vehicles, expensive electronics) gets human
// eyes first; furniture and low-risk items wait.
const RISK_CATEGORIES = new Set([
    'Sedans', 'SUVs', 'Motorcycles',
    'iPhones', 'Androids', 'Laptops', 'TVs', 'Cameras',
])

// Admin-only listings queue. Shows products whose auto-review trigger left
// them pending — typically the seller's first 3 listings. After 3 clean
// approvals the trigger auto-publishes their work and they stop landing
// here. Reports + admin removal handle anything that slips through.
//
// Uses the service-role client so RLS doesn't hide other users' listings.
export default async function AdminApproveListings() {

    const supabase = createAdminClient()
    const { data: products } = await supabase
        .from('products')
        .select(`
            id, name, description, images, category, location, price, free,
            was_price, condition, service, vehicle, created_at,
            store:stores!inner(
                id, name, username, created_at,
                user:profiles!stores_user_id_fkey(id, name, email, image, created_at)
            )
        `)
        .eq('review_status', 'pending')
        .is('removed_at', null)
        .order('created_at', { ascending: true })

    // Risk sort: bucket vehicles/electronics into "high risk" first, then by
    // created_at within each bucket. Cheap to do in JS for an admin queue.
    const sorted = (products || []).slice().sort((a, b) => {
        const aRisk = RISK_CATEGORIES.has(a.category) ? 0 : 1
        const bRisk = RISK_CATEGORIES.has(b.category) ? 0 : 1
        if (aRisk !== bRisk) return aRisk - bRisk
        return new Date(a.created_at) - new Date(b.created_at)
    })

    return <ApproveQueue products={sorted} />
}
