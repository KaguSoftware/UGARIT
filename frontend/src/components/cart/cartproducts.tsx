"use client";
import CartProductCard from "../cards/CartProduct/CartProductCard";
import { cartProduct } from "../cards/CartProduct/types";

interface cartProductGridProps {
    cartproducts: cartProduct[];
}

const CartProductGrid = ({ cartproducts }: cartProductGridProps) => {
    return (
        <div className="grid md:p-3 p-0 md:gap-5 gap-3 z-0">
            {cartproducts.map((product) => (
                <CartProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default CartProductGrid;
