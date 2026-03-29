import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import Navbar from "@/src/components/ui/navbar";
import { Footer } from "@/src/components/footer/footer";
import WaButton from "@/src/components/cards/whatsappButton/Wabutton";

export default async function LocaleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            <body>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Navbar />
                    {children}
                    <WaButton />
                    <Footer />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
