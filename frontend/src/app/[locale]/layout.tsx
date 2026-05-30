import { Footer } from "@/src/components/footer/footer";
import Navbar from "@/src/components/navbar/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { getOrCreateCart } from "@/src/lib/cart-actions";
import { CartItem } from "@/src/types/cart";
import { Toaster } from "react-hot-toast";
import { fetchNavbarCategories } from "@/src/lib/queries";
import { AuthModalProvider } from "@/src/context/AuthModalContext";

function getNavbarCategories(locale: string) {
    return unstable_cache(
        async () => {
            try {
                return await fetchNavbarCategories(locale);
            } catch (error) {
                console.error("Failed to fetch categories", error);
                return [];
            }
        },
        [`navbar-categories-${locale}`],
        { revalidate: 300, tags: ["navbar-categories"] }
    )();
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

    const cookieStore = await cookies();
    const cartSessionId = cookieStore.get("cartSessionId")?.value;

    const [categories, cartData] = await Promise.all([
        getNavbarCategories(locale),
        cartSessionId ? getOrCreateCart(cartSessionId) : Promise.resolve(null),
    ]);

    const rawItems = cartData?.cart_items ?? [];

    const formattedCartItems: CartItem[] = rawItems.map((item) => ({
        documentId: item.id,
        productDocumentId: item.product?.id || "",
        title: item.title_snapshot,
        slug: item.slug_snapshot,
        imageUrl: item.image_snapshot || "",
        size: item.size as CartItem["size"],
        quantity: item.quantity,
        unitPrice: item.unit_price,
    }));

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthModalProvider>
                <Navbar
                    strapiCategories={categories}
                    cartItems={formattedCartItems}
                />
                <Toaster position="top-center" />
                {children}
                <Footer />
            </AuthModalProvider>
        </NextIntlClientProvider>
    );
}
