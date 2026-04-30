import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from '@/lib/supabase/mappers'
import ServicesView from './ServicesView'

// Service listings only (products with `service` jsonb populated). Approved
// + active shops only — same B+C visibility rules as /shop. Filter UI runs
// in-memory on the client child since the dataset is small enough; we can
// move to server-side filtering later when volume justifies it.
export default async function Services() {

    const supabase = await createClient()

    const [{ data: rows }, userRes] = await Promise.all([
        supabase
            .from('products')
            .select(PRODUCT_WITH_STORE_SELECT)
            .not('service', 'is', null)
            .is('removed_at', null)
            .eq('store.status', 'approved')
            .eq('store.is_active', true)
            .order('featured', { ascending: false })
            .order('bumped_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false }),
        supabase.auth.getUser(),
    ])

    const services = (rows || []).map(mapProductRow)

    // Provider status drives the CTA. Pulled here (not just navbar) so the
    // /services page can show the right call-to-action button — verified
    // providers see "Provider dashboard", pending see "Verification in
    // review", everyone else sees "Offer a service".
    let providerStatus = null
    const user = userRes.data?.user
    if (user) {
        const { data: app } = await supabase
            .from('provider_applications')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle()
        providerStatus = app?.status || null
    }

    return (
        <Suspense fallback={<div className='p-8 text-slate-500'>Loading services...</div>}>
            <ServicesView services={services} providerStatus={providerStatus} />
        </Suspense>
    )
}
