import { notFound } from "next/navigation"
import ServicePage from "@/components/ServicePage"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_WITH_STORE_SELECT, mapProductRow } from "@/lib/supabase/mappers"

export default async function ServiceRoute({ params }) {

    const { id } = await params
    const supabase = await createClient()

    const { data: row } = await supabase
        .from('products')
        .select(PRODUCT_WITH_STORE_SELECT)
        .eq('id', id)
        .is('removed_at', null)
        .maybeSingle()

    if (!row) notFound()
    if (!row.service) {
        return <div className='p-12 text-center text-slate-500 text-sm'>This listing is not a service.</div>
    }

    const product = mapProductRow(row)
    return <ServicePage product={product} />
}
