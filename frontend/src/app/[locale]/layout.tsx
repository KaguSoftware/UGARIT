import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import Navbar from "@/src/components/ui/navbar";

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
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
