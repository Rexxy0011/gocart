'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/auth/admins'

// Server action for the admin approval queue. Called from /admin/approve.
// Re-checks admin membership server-side — middleware already gates the
// route, but a server action is callable directly so we double-check.
//
// Once authorized, we switch to the service-role admin client to perform
// the mutation, because RLS only lets a user update rows they own.
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
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
    revalidatePath('/store')  // refresh seller's banner
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
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
