'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated, clearAdminCookie } from '@/lib/auth/admin-pass'

// Server action for the admin approval queue. Called from /admin/approve.
// Re-checks the admin password cookie server-side — middleware already
// gates the route, but a server action is callable directly so we
// double-check before mutating.
//
// Once authorized, we use the service-role admin client to perform the
// mutation; RLS would otherwise block writes to rows we don't own.
//
// `reason` is required when rejecting, ignored on approve. Persisted to
// stores.rejection_reason so the seller's dashboard can surface it.
export async function setStoreStatus(storeId, status, reason = '') {
    if (!['approved', 'rejected'].includes(status)) {
        return { error: 'Invalid status' }
    }
    if (status === 'rejected' && !reason?.trim()) {
        return { error: 'A rejection reason is required.' }
    }

    if (!(await isAdminAuthenticated())) {
        return { error: 'Not authorized' }
    }

    const update = {
        status,
        is_active: status === 'approved',
        rejection_reason: status === 'rejected' ? reason.trim() : null,
    }

    const admin = createAdminClient()
    const { error } = await admin
        .from('stores')
        .update(update)
        .eq('id', storeId)

    if (error) return { error: error.message }

    revalidatePath('/admin/approve')
    revalidatePath('/store')
    return { ok: true }
}

// Mirror of setStoreStatus, scoped to provider applications. Same B+C model:
// admin reviews once per applicant, listing visibility / dashboard access flips
// on approval. Reason required for rejection.
export async function setProviderApplicationStatus(applicationId, status, reason = '') {
    if (!['approved', 'rejected'].includes(status)) {
        return { error: 'Invalid status' }
    }
    if (status === 'rejected' && !reason?.trim()) {
        return { error: 'A rejection reason is required.' }
    }

    if (!(await isAdminAuthenticated())) {
        return { error: 'Not authorized' }
    }

    const admin = createAdminClient()
    const { error } = await admin
        .from('provider_applications')
        .update({
            status,
            rejection_reason: status === 'rejected' ? reason.trim() : null,
        })
        .eq('id', applicationId)

    if (error) return { error: error.message }

    revalidatePath('/admin/providers')
    revalidatePath('/pro')
    revalidatePath('/pro/apply')
    return { ok: true }
}

// Per-listing review action. Replaces the per-shop approval flow now that
// shops auto-approve and review happens at the listing level. Approve →
// review_status='approved', listing goes live. Reject → review_status=
// 'rejected', rejection_reason recorded for the seller's dashboard.
export async function setProductReviewStatus(productId, status, reason = '') {
    if (!['approved', 'rejected'].includes(status)) {
        return { error: 'Invalid status' }
    }
    if (status === 'rejected' && !reason?.trim()) {
        return { error: 'A rejection reason is required.' }
    }

    if (!(await isAdminAuthenticated())) {
        return { error: 'Not authorized' }
    }

    const admin = createAdminClient()
    const { error } = await admin
        .from('products')
        .update({
            review_status: status,
            reviewed_at: new Date().toISOString(),
            rejection_reason: status === 'rejected' ? reason.trim() : null,
        })
        .eq('id', productId)

    if (error) return { error: error.message }

    revalidatePath('/admin/approve')
    revalidatePath('/store/manage-product')
    return { ok: true }
}

// Sign out of the admin panel — clears the gc_admin cookie and bounces
// the user back to the login page. Called from a small form/button in
// AdminNavbar.
export async function adminSignOut() {
    await clearAdminCookie()
    redirect('/admin/login')
}
