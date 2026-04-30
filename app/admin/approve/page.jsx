import { createAdminClient } from "@/lib/supabase/admin"
import ApproveQueue from "./ApproveQueue"

// Admin-only by middleware. Lists every store still pending review. Uses
// the service-role client so RLS doesn't hide stores the admin doesn't own.
export default async function AdminApprove() {

    const supabase = createAdminClient()
    const { data: stores } = await supabase
        .from('stores')
        .select(`
            id, name, username, description, address, status, logo,
            email, contact, created_at,
            user:profiles!stores_user_id_fkey ( id, name, email, image )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    return <ApproveQueue stores={stores || []} />
}
