'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/auth/admins'

// Anyone signed in can report a listing. Submission keeps the listing live
// — only an admin's "action" decision actually removes it. Each report is
// its own row, so 10 reports on one listing = 10 rows; admin sees them all
// and decides once.
export async function submitReport({ listingId, reason, description }) {
    if (!listingId || !reason?.trim()) {
        return { error: 'Pick a reason for the report.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You need to be signed in to report a listing.' }

    // Don't let users report their own listing — that's almost certainly a
    // mistake or the wrong tool (they should edit/remove from /store).
    const { data: listing } = await supabase
        .from('products')
        .select('id, store:stores!inner(user_id)')
        .eq('id', listingId)
        .maybeSingle()
    if (!listing) return { error: 'Listing not found.' }
    if (listing.store.user_id === user.id) {
        return { error: 'You can\'t report your own listing — edit or delete it from your dashboard instead.' }
    }

    const { error } = await supabase
        .from('reports')
        .insert({
            reporter_id: user.id,
            listing_id: listingId,
            reason: reason.trim(),
            description: description?.trim() || null,
        })

    if (error) return { error: error.message }
    return { ok: true }
}

// Admin-only. action = 'dismiss' | 'remove-listing'
export async function adminResolveReport(reportId, action, adminNote = '') {
    if (!['dismiss', 'remove-listing'].includes(action)) {
        return { error: 'Invalid action' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
        return { error: 'Not authorized' }
    }

    // Switch to service-role for the mutations. RLS keeps reports/products
    // owner-scoped for normal users, so the admin needs to bypass it.
    const admin = createAdminClient()

    // Pull the report so we know the listing involved (we only update its
    // status if the admin is actioning, not dismissing).
    const { data: report } = await admin
        .from('reports')
        .select('id, listing_id')
        .eq('id', reportId)
        .maybeSingle()
    if (!report) return { error: 'Report not found' }

    const now = new Date().toISOString()
    const newStatus = action === 'remove-listing' ? 'actioned' : 'dismissed'

    const { error: reportErr } = await admin
        .from('reports')
        .update({
            status: newStatus,
            admin_note: adminNote?.trim() || null,
            resolved_at: now,
        })
        .eq('id', reportId)
    if (reportErr) return { error: reportErr.message }

    if (action === 'remove-listing') {
        // Soft-remove the listing. Buyer-side queries filter `removed_at IS NULL`
        // so it disappears from public feeds. Conversations stay intact for
        // any audit / dispute the admin needs to look at later.
        const { error: listingErr } = await admin
            .from('products')
            .update({ removed_at: now })
            .eq('id', report.listing_id)
        if (listingErr) return { error: listingErr.message }

        // Auto-close any other open reports on the same listing — they're
        // now redundant.
        await admin
            .from('reports')
            .update({
                status: 'actioned',
                admin_note: 'Closed by admin removal of the listing.',
                resolved_at: now,
            })
            .eq('listing_id', report.listing_id)
            .eq('status', 'open')
            .neq('id', reportId)
    }

    revalidatePath('/admin/reports')
    return { ok: true }
}
