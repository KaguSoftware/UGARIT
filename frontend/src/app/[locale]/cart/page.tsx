import CartProductGrid from "@/src/components/cart/cartproducts";
import { CARTPRODUCTS } from "@/src/components/cards/CartProduct/constants";

export default function CartPage() {
    return (
        <main>
            <CartProductGrid cartproducts={CARTPRODUCTS} />
        </main>
    );
}
