import { cookies } from "next/headers";
import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";
import {
    getStrapiMedia,
    strapiPrivateFetch,
    strapiPublicFetch,
} from "@/src/lib/strapi";

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

async function getLikedProductIds(jwt: string) {
    try {
        const me = await strapiPrivateFetch<{ id: number }>("/api/users/me", {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });

        const userDbJson = await strapiPrivateFetch<{ data?: any[] }>(
            "/api/userdbs",
            {
                query: {
                    filters: {
                        email: {
                            $eq: undefined,
                        },
                    },
                    pagination: { pageSize: 1 },
                    fields: ["email", "username", "documentId"],
                    populate: {
                        likedProducts: { fields: ["documentId", "id"] },
                    },
                },
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            }
        ).catch(async () => {
            const meFull = await strapiPrivateFetch<{
                id: number;
                email?: string;
                username?: string;
            }>("/api/users/me", {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            const queries = [
                meFull.email
                    ? {
                          filters: {
                              email: {
                                  $eq: meFull.email,
                              },
                          },
                      }
                    : null,
                meFull.username
                    ? {
                          filters: {
                              username: {
                                  $eq: meFull.username,
                              },
                          },
                      }
                    : null,
            ].filter(Boolean) as Array<Record<string, any>>;

            for (const query of queries) {
                const response = await strapiPrivateFetch<{ data?: any[] }>(
                    "/api/userdbs",
                    {
                        query: {
                            ...query,
                            pagination: { pageSize: 1 },
                            fields: ["email", "username", "documentId"],
                            populate: {
                                likedProducts: {
                                    fields: ["documentId", "id"],
                                },
                            },
                        },
                        headers: {
                            Authorization: `Bearer ${jwt}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (Array.isArray(response?.data) && response.data[0]) {
                    return response;
                }
            }

            return { data: [] };
        });

        const entry = Array.isArray(userDbJson?.data)
            ? userDbJson.data[0]
            : null;

        const likedProducts = entry?.likedProducts ?? [];

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
