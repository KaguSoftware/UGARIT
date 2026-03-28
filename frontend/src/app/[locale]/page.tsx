import ProductCard from "@/src/components/cards/ProductCard/ProductCard";
import ProductGrid from "@/src/components/productsGrid/products";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { PRODUCTS } from "@/src/components/cards/ProductCard/constants";
import { constants } from "buffer";
export default function Home() {
    return (
        <MaxWidthWrapper>
            <main>
                <ProductGrid products={PRODUCTS} />
            </main>
        </MaxWidthWrapper>
    );
}
