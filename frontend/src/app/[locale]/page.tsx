import { unstable_cache } from "next/cache";
import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";
import {
    fetchFeaturedProducts,
    fetchHomepageCategories,
} from "@/src/lib/queries";
import { getLikedProductIds } from "@/src/lib/user-db";

function getFeaturedProducts(locale: string) {
    return unstable_cache(
        async () => {
            try {
                return await fetchFeaturedProducts(locale);
            } catch (error) {
                console.error("Failed to fetch featured products", error);
                return [];
            }
        },
        [`homepage-featured-${locale}`],
        { revalidate: 300, tags: [`homepage:${locale}:featured-products`] }
    )();
}

function getHomepageCategories(locale: string) {
    return unstable_cache(
        async () => {
            try {
                return await fetchHomepageCategories(locale);
            } catch (error) {
                console.error("Failed to fetch homepage categories", error);
                return [];
            }
        },
        [`homepage-categories-${locale}`],
        { revalidate: 300, tags: [`homepage:${locale}:categories`] }
    )();
}

export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const [featuredProducts, homepageCategories] = await Promise.all([
        getFeaturedProducts(locale),
        getHomepageCategories(locale),
    ]);

    const likedProductIds = await getLikedProductIds();

    return (
        <main>
            <MaxWidthWrapper>
                <CategoryGrid categories={homepageCategories} />
                <ProductCarousel
                    title="Featured Products"
                    products={featuredProducts}
                    likedProductIds={likedProductIds}
                />
                <ProductGrid
                    products={featuredProducts}
                    likedProductIds={likedProductIds}
                />
                <LocationCard />
            </MaxWidthWrapper>
        </main>
    );
}
