import { cookies } from "next/headers";
import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";
import {
    getStrapiMedia,
    strapiPublicFetch,
} from "@/src/lib/strapi";
import { getLikedProductIds } from "@/src/lib/user-db";

function extractImageUrl(image: any) {
    if (!image) return "/image1.jpeg";

    if (Array.isArray(image)) {
        return extractImageUrl(image[0]);
    }

    if (typeof image === "string") {
        return getStrapiMedia(image);
    }

    if (image.url) {
        return getStrapiMedia(image.url);
    }

    if (image.data) {
        return extractImageUrl(image.data);
    }

    if (image.attributes?.url) {
        return getStrapiMedia(image.attributes.url);
    }

    return "/image1.jpeg";
}

async function getFeaturedProducts(locale: string) {
    try {
        return await strapiPublicFetch<{ data: any[] }>("/api/products", {
            query: {
                locale,
                filters: {
                    isFeatured: {
                        $eq: true,
                    },
                },
                fields: ["documentId", "title", "price", "slug"],
                populate: {
                    image: { fields: ["url"] },
                    category: { fields: ["name"] },
                },
                sort: ["title:asc"],
            },
            revalidate: 300,
            tags: [`homepage:${locale}:featured-products`],
        });
    } catch (error) {
        console.error("Failed to fetch featured products", error);
        return { data: [] };
    }
}

async function getHomepageCategories(locale: string) {
    try {
        return await strapiPublicFetch<{ data: any[] }>("/api/categories", {
            query: {
                locale,
                fields: ["documentId", "name", "slug"],
                populate: {
                    image: { fields: ["url"] },
                },
                sort: ["name:asc"],
            },
            revalidate: 300,
            tags: [`homepage:${locale}:categories`],
        });
    } catch (error) {
        console.error("Failed to fetch homepage categories", error);
        return { data: [] };
    }
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}


export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const [productsResponse, categoriesResponse] = await Promise.all([
        getFeaturedProducts(locale),
        getHomepageCategories(locale),
    ]);

    const jwt = await getJwtFromCookie();
    const likedProductIds = jwt ? await getLikedProductIds(jwt) : [];

    const featuredProducts = productsResponse.data.map((item: any) => ({
        id: item.documentId,
        title: item.title,
        price: item.price,
        imageUrl: extractImageUrl(item.image),
        category: item.category?.name || "Uncategorized",
        slug: item.slug,
    }));

    const homepageCategories = categoriesResponse.data.map((item: any) => ({
        id: item.documentId || item.id,
        title: item.name,
        moreLink: `/categories/${item.slug}`,
        imageUrl: extractImageUrl(item.image),
    }));

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
