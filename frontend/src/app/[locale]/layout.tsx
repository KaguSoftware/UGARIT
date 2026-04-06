import { Footer } from "@/src/components/footer/footer";
import Navbar from "@/src/components/navbar/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getOrCreateCart } from "@/src/lib/cart-actions";
import { CartItem } from "@/src/types/cart";
import { Toaster } from "react-hot-toast";
import { strapiPublicFetch } from "@/src/lib/strapi";

async function getNavbarCategories() {
    try {
        const json = await strapiPublicFetch<{ data?: any[] }>(
            "/api/categories",
            {
                query: {
                    filters: {
                        showInNavbar: {
                            $eq: true,
                        },
                    },
                    fields: ["name", "slug"],
                    sort: ["name:asc"],
                },
                revalidate: 300,
                tags: ["navbar-categories"],
            }
        );

        return json.data ?? [];
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

    const rawItems = Array.isArray(cartData?.cart_items)
        ? cartData.cart_items
        : Array.isArray(cartData?.cart_items?.data)
        ? cartData.cart_items.data
        : [];

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
