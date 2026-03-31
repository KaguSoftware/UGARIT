import CartProductGrid from "@/src/components/cart/cartproducts";
import { CARTPRODUCTS } from "@/src/components/cards/CartProduct/constants";
import CartTandO from "@/src/components/cart/cartTotalAndorder/cartTandO";

export default function CartPage() {
    return (
        <main className="md:p-4 py-4 md:grid md:grid-cols-3 justify-between w-full">
            <div className="col-span-2">
                <CartProductGrid cartproducts={CARTPRODUCTS} />
            </div>
            <div className="w-full">
                <CartTandO />
            </div>
        </main>
    );
}
