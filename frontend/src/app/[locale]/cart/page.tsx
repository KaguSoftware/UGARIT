import CartProductGrid from "@/src/components/cart/cartproducts";
import CartTandO from "@/src/components/cart/cartTotalAndorder/cartTandO";
import { getOrCreateCart } from "@/src/lib/cart-actions";
import { getWhatsappNumber } from "@/src/lib/settings";
import { CartItem } from "@/src/types/cart";

export default async function CartPage() {
    const [cartData, whatsappNumber] = await Promise.all([
        getOrCreateCart(),
        getWhatsappNumber(),
    ]);

    const rawItems = cartData?.cart_items ?? [];

    const formattedItems: CartItem[] = rawItems.map((item) => ({
        documentId: item.id,
        productDocumentId: item.product?.id || "",
        title: item.title_snapshot,
        slug: item.slug_snapshot,
        imageUrl: item.image_snapshot || "",
        size: item.size as CartItem["size"],
        color: item.color ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
    }));

    return (
        <main className="md:p-4 py-4 md:grid md:grid-cols-3 justify-between w-full">
            <div className="col-span-2">
                <CartProductGrid cartproducts={formattedItems} />
            </div>
            <div className="w-full">
                <CartTandO
                    cartItems={formattedItems || []}
                    whatsappNumber={whatsappNumber}
                />{" "}
            </div>
        </main>
    );
}
