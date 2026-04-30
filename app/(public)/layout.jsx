import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Drives the navbar's "Provider" / "Offer a service" link target.
    let providerStatus = null
    if (user) {
        const { data: app } = await supabase
            .from('provider_applications')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle()
        providerStatus = app?.status || null
    }

    return (
        <>
            <Navbar user={user} providerStatus={providerStatus} />
            {children}
            <Footer />
        </>
    );
}
