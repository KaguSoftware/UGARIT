"use client";

import ProductCard from "../cards/ProductCard/ProductCard";
import { Product } from "../cards/ProductCard/types";
interface ProductGridProps {
    products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 p-3 gap-5 z-0 relative">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;
