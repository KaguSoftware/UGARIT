import CartProductGrid from "@/src/components/cart/cartproducts";
import CartTandO from "@/src/components/cart/cartTotalAndorder/cartTandO";
import { getOrCreateCart } from "@/src/lib/cart-actions";
import { CartItem } from "@/src/types/cart";

export default async function CartPage() {
    // 1. Fetch the cart from Strapi
    const cartData = await getOrCreateCart();

    // Just to see what we are getting back in your terminal
    console.log("Cart Data from Strapi:", JSON.stringify(cartData, null, 2));

    // 2. Safely map the Strapi data to the CartItem format your UI expects
    const cartItemsSource = cartData?.cart_items;
    const rawItems = Array.isArray(cartItemsSource)
        ? cartItemsSource
        : cartItemsSource?.data ?? [];

    const formattedItems: CartItem[] = rawItems.map((item: any) => ({
        documentId: item.documentId,
        productDocumentId: item.product?.documentId || "",
        title: item.titleSnapshot,
        slug: item.slugSnapshot,
        imageUrl: item.imageSnapshot || "",
        size: item.size,
        color: item.color, // <-- Added this line!
        quantity: item.quantity,
        unitPrice: item.unitPrice,
    }));

    return (
        <main className="md:p-4 py-4 md:grid md:grid-cols-3 justify-between w-full">
            <div className="col-span-2">
                <CartProductGrid cartproducts={formattedItems} />
            </div>
            <div className="w-full">
                <CartTandO cartItems={formattedItems || []} />{" "}
            </div>
        </main>
    );
}
