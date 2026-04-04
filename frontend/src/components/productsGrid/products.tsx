"use client";

import ProductCard from "../cards/ProductCard/ProductCard";
import { Product } from "../cards/ProductCard/types";
interface ProductGridProps {
    products: Product[];
    likedProductIds?: Array<string | number>;
}

const ProductGrid = ({ products, likedProductIds = [] }: ProductGridProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 md:p-3 p-0 md:gap-5 gap-3 z-0 ">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={{
                        ...product,
                        isLiked: likedProductIds.some(
                            (likedId) => String(likedId) === String(product.id)
                        ),
                    }}
                />
            ))}
        </div>
    );
};

export default ProductGrid;
