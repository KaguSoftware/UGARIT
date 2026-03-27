// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Footer } from "@/src/components/footer/footer";

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const messages = await getMessages();
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} className="h-full antialiased">
            <body className="min-h-full flex flex-col">
                <NextIntlClientProvider messages={messages}>
                    {/* The main page content */}
                    <main className="flex-grow">{children}</main>

                    {/* The Footer MUST be inside the provider here! */}
                    <Footer />
                </NextIntlClientProvider>
            </body>
        </html>
    );
}