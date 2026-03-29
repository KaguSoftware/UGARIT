import Navbar from "@/src/components/navbar/Navbar";
import { Footer } from "@/src/components/footer/footer";
import WaButton from "@/src/components/cards/whatsappButton/Wabutton";

export default async function LocaleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            {children}
            <WaButton />
            <Footer />
        </>
    );
}
