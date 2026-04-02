import { Footer } from "@/src/components/footer/footer";
import Navbar from "@/src/components/navbar/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

async function getNavbarCategories() {
    try {
        const res = await fetch(
            "http://127.0.0.1:1337/api/categories?filters[showInNavbar][$eq]=true",
            { cache: "no-store" }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error("Failed to fetch categories", error);
        return [];
    }
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    const categories = await getNavbarCategories();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <Navbar strapiCategories={categories} />
            {children}
            <Footer />
        </NextIntlClientProvider>
    );
}
