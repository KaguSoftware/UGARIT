import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import { CATEGORIES } from "@/src/components/cards/CategoryCard/constants";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { PRODUCTS } from "@/src/components/cards/ProductCard/constants";
import ProductGrid from "@/src/components/productsGrid/products";

export default function Home() {
    return (
        <main>
            <MaxWidthWrapper>
                <CategoryGrid categories={CATEGORIES} />
                <ProductGrid products={PRODUCTS} />

                <LocationCard />
            </MaxWidthWrapper>
        </main>
    );
}
