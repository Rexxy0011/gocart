import { createAdminClient, signProviderDocUrl } from "@/lib/supabase/admin"
import ProviderQueue from "./ProviderQueue"

// Admin-only by middleware. Lists every provider application still pending
// review. Each row carries signed download URLs for the ID + selfie so the
// admin can verify the docs without anyone else being able to. Uses the
// service-role client so RLS doesn't hide other users' applications.
export default async function AdminProviders() {

    const supabase = createAdminClient()
    const { data: applications } = await supabase
        .from('provider_applications')
        .select(`
            id, full_name, phone, id_type, id_document_url, selfie_url,
            primary_category, specialties, location, area_covered,
            years_experience, bio, certifications, status, created_at,
            user:profiles!provider_applications_user_id_fkey(id, name, email, image)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    // Sign the storage paths now (60-minute window) so the client component
    // doesn't need to know the service role key.
    const enriched = await Promise.all(
        (applications || []).map(async (app) => ({
            ...app,
            id_document_signed_url: await signProviderDocUrl(app.id_document_url),
            selfie_signed_url: await signProviderDocUrl(app.selfie_url),
        }))
    )

    return <ProviderQueue applications={enriched} />
}
