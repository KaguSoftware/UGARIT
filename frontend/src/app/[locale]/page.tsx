import { cookies } from "next/headers";
import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";

export const dynamic = "force-dynamic";

const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

function getMediaUrl(url?: string | null) {
    if (!url) return "/image1.jpeg";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
}

function extractImageUrl(image: any) {
    if (!image) return "/image1.jpeg";

    if (Array.isArray(image)) {
        return extractImageUrl(image[0]);
    }

    if (typeof image === "string") {
        return getMediaUrl(image);
    }

    if (image.url) {
        return getMediaUrl(image.url);
    }

    if (image.data) {
        return extractImageUrl(image.data);
    }

    if (image.attributes?.url) {
        return getMediaUrl(image.attributes.url);
    }

    return "/image1.jpeg";
}

function extractLinkedAuthUserId(entry: any): number | null {
    const candidates = [
        entry?.authUser,
        entry?.auth_user,
        entry?.user,
        entry?.users_permissions_user,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "number") {
            return candidate;
        }

        if (
            candidate &&
            typeof candidate === "object" &&
            typeof candidate.id === "number"
        ) {
            return candidate.id;
        }
    }

    return null;
}

async function getFeaturedProducts() {
    try {
        const res = await fetch(
            `${STRAPI_URL}/api/products?filters[isFeatured][$eq]=true&populate=*`,
            { cache: "no-store" }
        );

        if (!res.ok) return { data: [] };
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch featured products", error);
        return { data: [] };
    }
}

async function getHomepageCategories(locale: string) {
    try {
        const res = await fetch(
            `${STRAPI_URL}/api/categories?locale=${locale}&populate[image]=true`,
            { cache: "no-store" }
        );

        if (!res.ok) return { data: [] };
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch homepage categories", error);
        return { data: [] };
    }
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function getLikedProductIds(jwt: string) {
    try {
        const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            cache: "no-store",
        });

        if (!meRes.ok) return [] as Array<string | number>;

        const me = await meRes.json();

        const userDbRes = await fetch(`${STRAPI_URL}/api/userdbs?populate=*`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!userDbRes.ok) return [] as Array<string | number>;

        const userDbJson = await userDbRes.json();
        const entries = Array.isArray(userDbJson?.data) ? userDbJson.data : [];

        const entry = entries.find(
            (item: any) => extractLinkedAuthUserId(item) === me.id
        );

        const likedProducts =
            entry?.likedProducts ?? entry?.liked_products ?? [];

        if (Array.isArray(likedProducts)) {
            return likedProducts
                .map((product: any) => product?.documentId ?? product?.id)
                .filter(Boolean);
        }

        return [] as Array<string | number>;
    } catch (error) {
        console.error("Failed to fetch liked products", error);
        return [] as Array<string | number>;
    }
}

export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const [productsResponse, categoriesResponse] = await Promise.all([
        getFeaturedProducts(),
        getHomepageCategories(locale),
    ]);

    const jwt = await getJwtFromCookie();
    const likedProductIds = jwt ? await getLikedProductIds(jwt) : [];

    console.log(
        "STRAPI CATEGORIES:",
        JSON.stringify(categoriesResponse.data, null, 2)
    );

    const featuredProducts = productsResponse.data.map((item: any) => ({
        id: item.documentId,
        title: item.title,
        price: item.price,
        imageUrl: extractImageUrl(item.image),
        category: item.category?.name || "Uncategorized",
        slug: item.slug,
    }));

    const homepageCategories = categoriesResponse.data.map((item: any) => ({
        id: item.id || item.documentId,
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
