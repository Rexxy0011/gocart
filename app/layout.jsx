import { Outfit, Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import AuthModal from "@/components/AuthModal";
import { UserProvider } from "@/lib/auth/UserContext";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "GoCart. - Shop smarter",
    description: "GoCart. - Shop smarter",
};

export default async function RootLayout({ children }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <body className={`${outfit.className} antialiased`}>
                <StoreProvider>
                    <UserProvider user={user}>
                        <Toaster />
                        {children}
                        <AuthModal />
                    </UserProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
