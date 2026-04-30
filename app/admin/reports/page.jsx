import { createAdminClient } from "@/lib/supabase/admin"
import ReportsQueue from "./ReportsQueue"

// Admin-only reports queue. Shows every open report grouped by listing —
// many users can report the same listing, and admin should see all the
// signal at once before deciding. Uses the service-role client so RLS
// doesn't hide reports filed by other users or against other sellers.
export default async function AdminReports() {

    const supabase = createAdminClient()

    const { data: reports } = await supabase
        .from('reports')
        .select(`
            id, reason, description, status, created_at,
            reporter:profiles!reports_reporter_id_fkey(id, name, email),
            listing:products!reports_listing_id_fkey(
                id, name, images, removed_at, service,
                store:stores!products_store_id_fkey(id, name, username)
            )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: true })

    // Group by listing so admin sees all reports on the same item together.
    const byListing = new Map()
    for (const r of reports || []) {
        const lid = r.listing?.id
        if (!lid) continue
        if (!byListing.has(lid)) {
            byListing.set(lid, { listing: r.listing, reports: [] })
        }
        byListing.get(lid).reports.push(r)
    }

    return <ReportsQueue groups={[...byListing.values()]} />
}
