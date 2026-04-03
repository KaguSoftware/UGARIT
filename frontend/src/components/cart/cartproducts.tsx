"use client";
import CartProductCard from "../cards/CartProduct/CartProductCard";
import { CartItem } from "@/src/types/cart";

interface cartProductGridProps {
	cartproducts: CartItem[];
}

const CartProductGrid = ({ cartproducts }: cartProductGridProps) => {
	return (
		<div className="grid p-0 md:gap-5 gap-3 z-0">
			{cartproducts.map((product) => (
				<CartProductCard key={product.documentId} product={product} />
			))}
		</div>
	);
};

export default CartProductGrid;
