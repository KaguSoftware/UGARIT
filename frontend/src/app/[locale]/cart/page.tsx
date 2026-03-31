import CartProductGrid from "@/src/components/cart/cartproducts";
import { CARTPRODUCTS } from "@/src/components/cards/CartProduct/constants";

export default function CartPage() {
    return (
        <main className="p-4">
            <CartProductGrid cartproducts={CARTPRODUCTS} />
        </main>
    );
}
