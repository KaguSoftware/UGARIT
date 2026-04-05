import { Footer } from "@/src/components/footer/footer";
import Navbar from "@/src/components/navbar/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getOrCreateCart } from "@/src/lib/cart-actions";
import { CartItem } from "@/src/types/cart";
import { Toaster } from "react-hot-toast";

const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

async function getNavbarCategories() {
    try {
        const res = await fetch(
            `${STRAPI_URL}/api/categories?filters[showInNavbar][$eq]=true`,
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

    const [categories, cartData] = await Promise.all([
        getNavbarCategories(),
        getOrCreateCart(),
    ]);

    const rawItems = cartData?.cart_items || [];
    const formattedCartItems: CartItem[] = rawItems.map((item: any) => ({
        documentId: item.documentId,
        productDocumentId: item.product?.documentId || "",
        title: item.titleSnapshot,
        slug: item.slugSnapshot,
        imageUrl: item.imageSnapshot || "",
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
    }));

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <Navbar
                strapiCategories={categories}
                cartItems={formattedCartItems}
            />
            <Toaster position="top-center" />
            {children}
            <Footer />
        </NextIntlClientProvider>
    );
}
